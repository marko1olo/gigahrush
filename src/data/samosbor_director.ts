import { FloorLevel, type WorldEventSeverity } from '../core/types';
import { type SamosborVariantId } from './samosbor_variants';

export type SamosborBeatPhase = 'warning' | 'active' | 'aftermath';

export type SamosborBeatEffectId =
  | 'warning_line'
  | 'local_fog_residue'
  | 'extra_patrol'
  | 'resource_shortage'
  | 'rumor_seed'
  | 'door_malfunction'
  | 'container_theft'
  | 'monster_aftershock';

export interface SamosborBeatDef {
  id: string;
  phase: SamosborBeatPhase;
  floors: readonly FloorLevel[];
  variants: readonly SamosborVariantId[];
  weight: number;
  cooldown: number;
  maxPerCycle: number;
  tags: readonly string[];
  effectId: SamosborBeatEffectId;
  line: string;
  color: string;
  severity: WorldEventSeverity;
  resourceId?: string;
}

export const SAMOSBOR_DIRECTOR_PHASE_BUDGET: Record<SamosborBeatPhase, number> = {
  warning: 1,
  active: 3,
  aftermath: 1,
};

export const SAMOSBOR_DIRECTOR_MIN_INTERVAL: Record<SamosborBeatPhase, number> = {
  warning: 6,
  active: 10,
  aftermath: 6,
};

export const SAMOSBOR_DIRECTOR_EFFECT_FAIL_COOLDOWN = 20;

const ALL_FLOORS = [
  FloorLevel.MINISTRY,
  FloorLevel.KVARTIRY,
  FloorLevel.LIVING,
  FloorLevel.MAINTENANCE,
  FloorLevel.HELL,
  FloorLevel.VOID,
] as const;

const CIVIL_FLOORS = [FloorLevel.MINISTRY, FloorLevel.KVARTIRY, FloorLevel.LIVING] as const;
const SERVICE_FLOORS = [FloorLevel.KVARTIRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE] as const;
const MAINTENANCE_FLOORS = [FloorLevel.MAINTENANCE] as const;
const HELL_FLOORS = [FloorLevel.HELL] as const;
const VOID_FLOORS = [FloorLevel.VOID] as const;
const ALL_VARIANTS = ['classic', 'quiet', 'wet', 'electric', 'meat', 'maronary', 'istotit', 'veretar'] as const;

const registry: SamosborBeatDef[] = [];
const registeredIds = new Set<string>();

export function registerSamosborBeat(def: SamosborBeatDef): void {
  if (registeredIds.has(def.id)) {
    console.warn(`[samosbor_director] duplicate beat id: ${def.id}`);
    return;
  }
  registeredIds.add(def.id);
  registry.push(def);
}

export function getSamosborBeatDefs(): readonly SamosborBeatDef[] {
  return registry;
}

const BASELINE_BEATS: readonly SamosborBeatDef[] = [
  {
    id: 'pre_airlock_warning',
    phase: 'warning',
    floors: ALL_FLOORS,
    variants: ALL_VARIANTS,
    weight: 28,
    cooldown: 180,
    maxPerCycle: 1,
    tags: ['warning', 'airlock'],
    effectId: 'warning_line',
    line: 'Диспетчер: ближайший шлюз проверен только на бумаге, бумага сухая.',
    color: '#fc4',
    severity: 3,
  },
  {
    id: 'pre_corridor_rumor_seed',
    phase: 'warning',
    floors: CIVIL_FLOORS,
    variants: ['classic', 'quiet', 'wet', 'electric'],
    weight: 18,
    cooldown: 240,
    maxPerCycle: 1,
    tags: ['rumor', 'social'],
    effectId: 'rumor_seed',
    line: 'Слух идёт по коридору раньше сирены: туман уже выбрал секцию и примеряет голоса.',
    color: '#ccf',
    severity: 2,
  },
  {
    id: 'pre_social_roll_call',
    phase: 'warning',
    floors: CIVIL_FLOORS,
    variants: ALL_VARIANTS,
    weight: 26,
    cooldown: 210,
    maxPerCycle: 1,
    tags: ['warning', 'social', 'counterplay'],
    effectId: 'warning_line',
    line: 'По этажу пошла перекличка. Рабочую герму называют шёпотом: следуй за спором, не за толпой.',
    color: '#ccf',
    severity: 3,
  },
  {
    id: 'pre_maintenance_pressure_gauge',
    phase: 'warning',
    floors: MAINTENANCE_FLOORS,
    variants: ['classic', 'wet', 'electric', 'maronary', 'veretar'],
    weight: 32,
    cooldown: 210,
    maxPerCycle: 1,
    tags: ['warning', 'maintenance', 'pressure', 'counterplay'],
    effectId: 'warning_line',
    line: 'Манометр дёрнулся до сирены. К сухому шлюзу сейчас; у воды самосбор слышит быстрее.',
    color: '#58c',
    severity: 3,
  },
  {
    id: 'pre_hell_meat_seam',
    phase: 'warning',
    floors: HELL_FLOORS,
    variants: ['quiet', 'wet', 'meat', 'maronary', 'veretar'],
    weight: 34,
    cooldown: 210,
    maxPerCycle: 1,
    tags: ['warning', 'hell', 'meat', 'counterplay'],
    effectId: 'warning_line',
    line: 'Швы стен набухли до сирены. Держись середины прохода и не верь красной безопасной зоне.',
    color: '#d64b5f',
    severity: 4,
  },
  {
    id: 'pre_void_anchor_warning',
    phase: 'warning',
    floors: VOID_FLOORS,
    variants: ['classic', 'quiet', 'maronary', 'veretar'],
    weight: 36,
    cooldown: 210,
    maxPerCycle: 1,
    tags: ['warning', 'void', 'counterplay'],
    effectId: 'warning_line',
    line: 'Пустота убрала звук шагов. Держи тёмную герму в поле зрения; светлый маршрут может быть областью.',
    color: '#f4f1df',
    severity: 4,
  },
  {
    id: 'pre_door_malfunction',
    phase: 'warning',
    floors: ALL_FLOORS,
    variants: ['quiet', 'wet', 'electric', 'meat'],
    weight: 20,
    cooldown: 210,
    maxPerCycle: 1,
    tags: ['door', 'warning'],
    effectId: 'door_malfunction',
    line: 'Гермопривод кашляет в стене. Одна дверь уже решает, кто сегодня жилец.',
    color: '#fa0',
    severity: 3,
  },
  {
    id: 'pre_quiet_no_siren_crosscheck',
    phase: 'warning',
    floors: ALL_FLOORS,
    variants: ['quiet'],
    weight: 31,
    cooldown: 210,
    maxPerCycle: 1,
    tags: ['warning', 'quiet', 'no_siren'],
    effectId: 'warning_line',
    line: 'Диспетчер: штатная сирена не подтверждена. Сверяйте карту, экраны и соседские крики.',
    color: '#9a6bd6',
    severity: 4,
  },
  {
    id: 'pre_veretar_white_area',
    phase: 'warning',
    floors: ALL_FLOORS,
    variants: ['veretar'],
    weight: 32,
    cooldown: 210,
    maxPerCycle: 1,
    tags: ['warning', 'veretar', 'white_area'],
    effectId: 'warning_line',
    line: 'Диспетчер: внешняя тревога слышна внутри дома. Белую область считать опасной, не видом.',
    color: '#f4f1df',
    severity: 4,
  },
  {
    id: 'pre_maronary_green_source',
    phase: 'warning',
    floors: ALL_FLOORS,
    variants: ['maronary'],
    weight: 32,
    cooldown: 180,
    maxPerCycle: 1,
    tags: ['warning', 'maronary', 'source'],
    effectId: 'warning_line',
    line: 'Сирена не взяла ноту. Зелёный источник в зоне смотрит первым.',
    color: '#35ff66',
    severity: 4,
  },
  {
    id: 'pre_istotit_bell_shelter',
    phase: 'warning',
    floors: CIVIL_FLOORS,
    variants: ['istotit'],
    weight: 34,
    cooldown: 180,
    maxPerCycle: 1,
    tags: ['warning', 'istotit', 'shelter'],
    effectId: 'warning_line',
    line: 'Колокол ударил без расписания. Золотые двери уже выбирают свидетелей.',
    color: '#d6a64b',
    severity: 4,
  },
  {
    id: 'active_floor_fog_residue',
    phase: 'active',
    floors: ALL_FLOORS,
    variants: ['classic', 'wet', 'electric', 'meat'],
    weight: 24,
    cooldown: 120,
    maxPerCycle: 2,
    tags: ['fog', 'danger'],
    effectId: 'local_fog_residue',
    line: 'Туман оставляет низкий след у пола, как мокрая тряпка после чужого обхода.',
    color: '#b68cff',
    severity: 3,
  },
  {
    id: 'active_maronary_wrong_door',
    phase: 'active',
    floors: ALL_FLOORS,
    variants: ['maronary'],
    weight: 24,
    cooldown: 180,
    maxPerCycle: 1,
    tags: ['door', 'maronary', 'route'],
    effectId: 'door_malfunction',
    line: 'Дверь щёлкнула не там. Маршрут стал короче и менее доказуемым.',
    color: '#35ff66',
    severity: 4,
  },
  {
    id: 'active_istotit_church_cache',
    phase: 'active',
    floors: CIVIL_FLOORS,
    variants: ['istotit'],
    weight: 18,
    cooldown: 300,
    maxPerCycle: 1,
    tags: ['theft', 'istotit', 'container'],
    effectId: 'container_theft',
    line: 'Пока хор держит ноту, кто-то сдвинул церковный запас ближе к рукам.',
    color: '#d6a64b',
    severity: 4,
  },
  {
    id: 'active_liquidator_patrol',
    phase: 'active',
    floors: SERVICE_FLOORS,
    variants: ['classic', 'quiet', 'electric'],
    weight: 16,
    cooldown: 180,
    maxPerCycle: 1,
    tags: ['patrol', 'faction'],
    effectId: 'extra_patrol',
    line: 'Ликвидаторский патруль идёт на шум самосбора. Патроны считают вполголоса.',
    color: '#6cf',
    severity: 3,
  },
  {
    id: 'active_social_shelter_argument',
    phase: 'active',
    floors: CIVIL_FLOORS,
    variants: ['quiet', 'electric', 'istotit', 'veretar'],
    weight: 18,
    cooldown: 240,
    maxPerCycle: 1,
    tags: ['rumor', 'social', 'shelter'],
    effectId: 'rumor_seed',
    line: 'За дверью спорят, кого пустили в укрытие. Слух станет уликой, если доживёт до отбоя.',
    color: '#ccf',
    severity: 3,
  },
  {
    id: 'active_maintenance_breaker_trip',
    phase: 'active',
    floors: MAINTENANCE_FLOORS,
    variants: ['wet', 'electric'],
    weight: 28,
    cooldown: 240,
    maxPerCycle: 1,
    tags: ['shortage', 'maintenance', 'electric'],
    effectId: 'resource_shortage',
    resourceId: 'electronics',
    line: 'Автомат выбило в щите. Электроника стала дефицитом раньше, чем свет понял, что погас.',
    color: '#72e6ff',
    severity: 3,
  },
  {
    id: 'active_hell_meat_hallway',
    phase: 'active',
    floors: HELL_FLOORS,
    variants: ['wet', 'meat'],
    weight: 26,
    cooldown: 180,
    maxPerCycle: 1,
    tags: ['fog', 'hell', 'meat', 'danger'],
    effectId: 'local_fog_residue',
    line: 'Красный след лег вдоль шва. Центр коридора остался честнее стены, но ненадолго.',
    color: '#d64b5f',
    severity: 4,
  },
  {
    id: 'active_void_false_relief',
    phase: 'active',
    floors: VOID_FLOORS,
    variants: ['classic', 'quiet', 'maronary', 'veretar'],
    weight: 28,
    cooldown: 180,
    maxPerCycle: 1,
    tags: ['fog', 'void', 'false_clear', 'danger'],
    effectId: 'local_fog_residue',
    line: 'Пустота показала чистый участок и тут же забыла его очистить. Проверяй край, не середину.',
    color: '#f4f1df',
    severity: 4,
  },
  {
    id: 'active_container_theft',
    phase: 'active',
    floors: CIVIL_FLOORS,
    variants: ['quiet', 'meat'],
    weight: 14,
    cooldown: 300,
    maxPerCycle: 1,
    tags: ['theft', 'container'],
    effectId: 'container_theft',
    line: 'Пока двери спорили с сиреной, кто-то вскрыл чужой запас и назвал это выживанием.',
    color: '#f84',
    severity: 4,
  },
  {
    id: 'active_water_shortage',
    phase: 'active',
    floors: SERVICE_FLOORS,
    variants: ['wet', 'electric'],
    weight: 18,
    cooldown: 240,
    maxPerCycle: 1,
    tags: ['shortage', 'water'],
    effectId: 'resource_shortage',
    resourceId: 'drink_water',
    line: 'Водяной запас ушёл в трубы. Цена воды дёрнулась раньше очереди.',
    color: '#58c',
    severity: 3,
  },
  {
    id: 'after_food_shortage',
    phase: 'aftermath',
    floors: CIVIL_FLOORS,
    variants: ALL_VARIANTS,
    weight: 22,
    cooldown: 420,
    maxPerCycle: 1,
    tags: ['shortage', 'food'],
    effectId: 'resource_shortage',
    resourceId: 'food',
    line: 'После перестройки часть пайков числится выданной стене. Стена не расписалась.',
    color: '#dbb36a',
    severity: 3,
  },
  {
    id: 'after_monster_aftershock',
    phase: 'aftermath',
    floors: ALL_FLOORS,
    variants: ['classic', 'wet', 'electric', 'meat'],
    weight: 18,
    cooldown: 300,
    maxPerCycle: 1,
    tags: ['monster', 'aftershock'],
    effectId: 'monster_aftershock',
    line: 'Отбой прозвучал, но в стене осталось лишнее дыхание и неучтённая слюна.',
    color: '#f68',
    severity: 4,
  },
  {
    id: 'after_survivor_rumor',
    phase: 'aftermath',
    floors: ALL_FLOORS,
    variants: ALL_VARIANTS,
    weight: 20,
    cooldown: 300,
    maxPerCycle: 1,
    tags: ['rumor', 'aftermath'],
    effectId: 'rumor_seed',
    line: 'Выжившие уже пересказывают, какая зона вернулась не вся и кто это заметил первым.',
    color: '#ccf',
    severity: 2,
  },
  {
    id: 'after_maronary_late_beep',
    phase: 'aftermath',
    floors: ALL_FLOORS,
    variants: ['maronary'],
    weight: 24,
    cooldown: 300,
    maxPerCycle: 1,
    tags: ['rumor', 'maronary', 'beep'],
    effectId: 'rumor_seed',
    line: 'После отбоя писк ушёл за стену. Соседи делают вид, что это проводка.',
    color: '#6cff88',
    severity: 3,
  },
  {
    id: 'after_istotit_witness_argument',
    phase: 'aftermath',
    floors: CIVIL_FLOORS,
    variants: ['istotit'],
    weight: 26,
    cooldown: 360,
    maxPerCycle: 1,
    tags: ['rumor', 'istotit', 'witness'],
    effectId: 'rumor_seed',
    line: 'После Истотита соседи считают укрытых громче, чем мёртвых.',
    color: '#d6a64b',
    severity: 3,
  },
];

for (const beat of BASELINE_BEATS) registerSamosborBeat(beat);

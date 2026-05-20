import { Faction } from '../core/types';

export type SlimeId =
  | 'slime_brown'
  | 'slime_green'
  | 'slime_white'
  | 'slime_red'
  | 'slime_black'
  | 'slime_blue'
  | 'slime_silver'
  | 'slime_seroburmaline';

export type SlimeRewardTier = 1 | 2 | 3 | 4 | 5;

export interface SlimeDef {
  id: SlimeId;
  name: string;
  tags: readonly string[];
  danger: number;
  cleanupHint: string;
  sampleId: string;
  rewardTier: SlimeRewardTier;
  preferredFactions: readonly Faction[];
  textHandles: readonly string[];
}

export const SLIME_DEFS: readonly SlimeDef[] = [
  {
    id: 'slime_brown',
    name: 'Коричневая слизь',
    tags: ['slime', 'sample', 'residue', 'odor', 'cleanup', 'toxic', 'civilian'],
    danger: 1,
    cleanupHint: 'Токсичный налёт: респиратор, акт зачистки, обход или прожиг до заселения комнаты.',
    sampleId: 'slime_sample_brown',
    rewardTier: 1,
    preferredFactions: [Faction.CITIZEN, Faction.LIQUIDATOR],
    textHandles: ['slime_brown_cleanup'],
  },
  {
    id: 'slime_green',
    name: 'Зелёная слизь',
    tags: ['slime', 'sample', 'residue', 'acid', 'organic_damage', 'ovs', 'science'],
    danger: 3,
    cleanupHint: 'Кислотная проба ОВС: держать дистанцию, брать щипцами, нейтрализовать щёлочью.',
    sampleId: 'slime_sample_green',
    rewardTier: 3,
    preferredFactions: [Faction.SCIENTIST, Faction.LIQUIDATOR],
    textHandles: ['slime_green_acid_sample'],
  },
  {
    id: 'slime_white',
    name: 'Белая слизь',
    tags: ['slime', 'sample', 'residue', 'psi', 'mutagenic', 'no_look', 'compulsion', 'npc_risk'],
    danger: 4,
    cleanupHint: 'Мутагенная проба: не смотреть, закрыть матовым боксом и вывести свидетелей.',
    sampleId: 'slime_sample_white',
    rewardTier: 4,
    preferredFactions: [Faction.SCIENTIST, Faction.CULTIST],
    textHandles: ['slime_white_look_away'],
  },
  {
    id: 'slime_red',
    name: 'Красная слизь',
    tags: ['slime', 'sample', 'residue', 'sticky', 'slow', 'trap'],
    danger: 3,
    cleanupHint: 'Обходить липкую зону; огонь или растворитель держат проход.',
    sampleId: 'slime_sample_red',
    rewardTier: 3,
    preferredFactions: [Faction.LIQUIDATOR, Faction.WILD],
    textHandles: ['slime_red_sticky_residue'],
  },
  {
    id: 'slime_black',
    name: 'Чёрная слизь',
    tags: ['slime', 'sample', 'residue', 'mass', 'spawn_risk', 'cult', 'uv'],
    danger: 4,
    cleanupHint: 'Чёрная масса плодит угрозы: герметизировать, светить УФ или жечь; культ рядом не оставлять.',
    sampleId: 'slime_sample_black',
    rewardTier: 4,
    preferredFactions: [Faction.SCIENTIST, Faction.LIQUIDATOR, Faction.CULTIST],
    textHandles: ['slime_black_uv_sample'],
  },
  {
    id: 'slime_blue',
    name: 'Голубая слизь',
    tags: ['slime', 'sample', 'residue', 'glow', 'energy', 'radiation_fear'],
    danger: 3,
    cleanupHint: 'Голубую пробу экранировать контейнером и не носить рядом с лампами.',
    sampleId: 'slime_sample_blue',
    rewardTier: 3,
    preferredFactions: [Faction.SCIENTIST, Faction.LIQUIDATOR],
    textHandles: ['slime_blue_glow_sample'],
  },
  {
    id: 'slime_silver',
    name: 'Прозрачная слизь',
    tags: ['slime', 'sample', 'residue', 'transparent', 'deceptive_value', 'temptation', 'relief', 'contraband'],
    danger: 5,
    cleanupHint: 'Обманчиво ценная прозрачная проба: не пробовать, не вскрывать, сдавать только запечатанной.',
    sampleId: 'slime_sample_silver',
    rewardTier: 5,
    preferredFactions: [Faction.WILD, Faction.CULTIST, Faction.SCIENTIST],
    textHandles: ['slime_silver_sealed_trade'],
  },
  {
    id: 'slime_seroburmaline',
    name: 'Серобурмалиновая слизь',
    tags: ['slime', 'sample', 'residue', 'visual_risk', 'cognitive_risk', 'void'],
    danger: 5,
    cleanupHint: 'Не смотреть на перелив, закрыть метки и идти по заранее отмеченному маршруту.',
    sampleId: 'slime_sample_seroburmaline',
    rewardTier: 5,
    preferredFactions: [Faction.SCIENTIST, Faction.CULTIST],
    textHandles: ['slime_seroburmaline_no_look'],
  },
];

export const SLIME_IDS: readonly SlimeId[] = SLIME_DEFS.map(def => def.id);
export const SLIME_SAMPLE_IDS: readonly string[] = SLIME_DEFS.map(def => def.sampleId);
export const SLIME_DEF_BY_ID = Object.fromEntries(SLIME_DEFS.map(def => [def.id, def])) as Record<SlimeId, SlimeDef>;
export const SLIME_DEF_BY_SAMPLE_ID: Record<string, SlimeDef> = Object.fromEntries(SLIME_DEFS.map(def => [def.sampleId, def]));

function duplicateStrings(values: readonly string[]): string[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].filter(([, count]) => count > 1).map(([value]) => value).sort();
}

export function getSlimeDef(id: string): SlimeDef | undefined {
  return SLIME_DEF_BY_ID[id as SlimeId];
}

export function getSlimeDefBySampleId(sampleId: string): SlimeDef | undefined {
  return SLIME_DEF_BY_SAMPLE_ID[sampleId];
}

export function validateSlimeDefs(): string[] {
  const problems: string[] = [];
  for (const id of duplicateStrings(SLIME_DEFS.map(def => def.id))) problems.push(`duplicate slime id:${id}`);
  for (const id of duplicateStrings(SLIME_SAMPLE_IDS)) problems.push(`duplicate slime sample id:${id}`);

  for (const def of SLIME_DEFS) {
    if (!def.tags.includes('slime')) problems.push(`${def.id}:missing slime tag`);
    if (!def.tags.includes('sample')) problems.push(`${def.id}:missing sample tag`);
    if (!Number.isInteger(def.danger) || def.danger < 1 || def.danger > 5) problems.push(`${def.id}:danger:${def.danger}`);
    if (!Number.isInteger(def.rewardTier) || def.rewardTier < 1 || def.rewardTier > 5) problems.push(`${def.id}:rewardTier:${def.rewardTier}`);
    if (def.cleanupHint.trim().length < 12) problems.push(`${def.id}:cleanupHint`);
    if (def.sampleId.trim().length === 0) problems.push(`${def.id}:sampleId`);
    if (def.preferredFactions.length === 0) problems.push(`${def.id}:preferredFactions`);
    if (def.textHandles.length === 0) problems.push(`${def.id}:textHandles`);
  }

  return problems;
}

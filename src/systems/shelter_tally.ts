import {
  Faction,
  type Entity,
  type GameState,
  type WorldContainer,
  type WorldEventPrivacy,
  type WorldEventSeverity,
} from '../core/types';
import { ITEMS } from '../data/catalog';
import { addFactionRelMutual } from '../data/relations';
import { publishEvent } from './events';

export const SHELTER_TALLY_ID = 'shelter_tally';
export const FORGED_SHELTER_TALLY_ID = 'forged_shelter_tally';

export type ShelterTallyOutcome =
  | 'submit_ministry'
  | 'submit_forged_ministry'
  | 'give_residents'
  | 'give_forged_residents'
  | 'forge'
  | 'sell_cult'
  | 'sell_liquidator'
  | 'hide'
  | 'stolen';

interface ShelterTallyEffect {
  targetName: string;
  targetFaction?: Faction;
  severity: WorldEventSeverity;
  privacy: WorldEventPrivacy;
  tags: string[];
  rumorIds: string[];
  consequence: string;
  relationDeltas?: [Faction, number][];
}

const EFFECTS: Record<ShelterTallyOutcome, ShelterTallyEffect> = {
  submit_ministry: {
    targetName: 'Министерство',
    severity: 4,
    privacy: 'local',
    tags: ['submit', 'ministry'],
    rumorIds: ['samosbor_istotit_tally_ministry'],
    consequence: 'Министерство получило фамилии укрытых; старшие секций уже записали, кто отнес список наверх.',
    relationDeltas: [[Faction.LIQUIDATOR, 2], [Faction.CITIZEN, -2]],
  },
  submit_forged_ministry: {
    targetName: 'Министерство',
    severity: 5,
    privacy: 'public',
    tags: ['submit', 'ministry', 'forgery'],
    rumorIds: ['samosbor_istotit_tally_forged'],
    consequence: 'Липовая ведомость ушла наверх, но печать слишком ровная, а старшая секции узнает чужой почерк.',
    relationDeltas: [[Faction.LIQUIDATOR, -4], [Faction.CITIZEN, -2]],
  },
  give_residents: {
    targetName: 'старшие подъезда',
    targetFaction: Faction.CITIZEN,
    severity: 4,
    privacy: 'local',
    tags: ['handoff', 'residents'],
    rumorIds: ['samosbor_istotit_tally_residents'],
    consequence: 'Старшие секций прочли список у батареи: кого вписали, кого забыли и кому теперь положена свеча.',
    relationDeltas: [[Faction.CITIZEN, 5]],
  },
  give_forged_residents: {
    targetName: 'старшие подъезда',
    targetFaction: Faction.CITIZEN,
    severity: 5,
    privacy: 'public',
    tags: ['handoff', 'residents', 'forgery'],
    rumorIds: ['samosbor_istotit_tally_forged'],
    consequence: 'Жильцы получили список с лишними живыми; домком спрашивает, кто держал ручку.',
    relationDeltas: [[Faction.CITIZEN, -5]],
  },
  forge: {
    targetName: 'поддельная печать',
    severity: 4,
    privacy: 'private',
    tags: ['forge', 'forgery'],
    rumorIds: ['samosbor_istotit_tally_forged'],
    consequence: 'В список добавлена чужая фамилия; старшая секции заметит не печать, а соседа, который молчит на перекличке.',
    relationDeltas: [[Faction.CITIZEN, -2]],
  },
  sell_cult: {
    targetName: 'культисты',
    targetFaction: Faction.CULTIST,
    severity: 4,
    privacy: 'local',
    tags: ['trade', 'cult'],
    rumorIds: ['samosbor_istotit_tally_sold'],
    consequence: 'Культ получил имена свидетелей; теперь этих людей будут искать у гермы после следующего колокола.',
    relationDeltas: [[Faction.CULTIST, 5], [Faction.CITIZEN, -4]],
  },
  sell_liquidator: {
    targetName: 'ликвидаторы',
    targetFaction: Faction.LIQUIDATOR,
    severity: 4,
    privacy: 'local',
    tags: ['trade', 'liquidator'],
    rumorIds: ['samosbor_istotit_tally_sold'],
    consequence: 'Ликвидаторы купили список как основание для обхода и допросов.',
    relationDeltas: [[Faction.LIQUIDATOR, 4], [Faction.CITIZEN, -3]],
  },
  hide: {
    targetName: 'тайник',
    severity: 3,
    privacy: 'local',
    tags: ['hide', 'stash'],
    rumorIds: ['samosbor_istotit_tally_hidden'],
    consequence: 'Ведомость спрятана; теперь домком считает пустые строки и тех, кто отводит глаза.',
    relationDeltas: [[Faction.CITIZEN, -2]],
  },
  stolen: {
    targetName: 'чужая ведомость',
    severity: 4,
    privacy: 'witnessed',
    tags: ['theft', 'stolen'],
    rumorIds: ['samosbor_istotit_tally_stolen'],
    consequence: 'Список укрытых украден до ревизии; старшая записала пропажу, свидетелей и тех, кто перестал отвечать.',
    relationDeltas: [[Faction.CITIZEN, -3]],
  },
};

export function isShelterTallyItem(defId: string): boolean {
  return defId === SHELTER_TALLY_ID || defId === FORGED_SHELTER_TALLY_ID;
}

export function publishShelterTallyEvent(
  state: GameState,
  actor: Entity,
  itemId: string,
  outcome: ShelterTallyOutcome,
  input: {
    targetId?: number;
    targetName?: string;
    targetFaction?: Faction;
    container?: WorldContainer;
    itemValue?: number;
    privacy?: WorldEventPrivacy;
  } = {},
): void {
  const effect = EFFECTS[outcome];
  const def = ITEMS[itemId];
  for (const [faction, delta] of effect.relationDeltas ?? []) {
    addFactionRelMutual(Faction.PLAYER, faction, delta);
  }
  publishEvent(state, {
    type: 'shelter_tally_handled',
    zoneId: input.container?.zoneId,
    roomId: input.container?.roomId,
    x: input.container?.x,
    y: input.container?.y,
    actorId: actor.id,
    actorName: actor.name ?? 'Вы',
    actorFaction: actor.faction,
    targetId: input.targetId,
    targetName: input.targetName ?? effect.targetName,
    targetFaction: input.targetFaction ?? effect.targetFaction,
    itemId,
    itemName: def?.name ?? itemId,
    itemCount: 1,
    itemValue: input.itemValue ?? def?.value ?? 0,
    containerId: input.container?.id,
    containerFaction: input.container?.faction,
    severity: effect.severity,
    privacy: input.privacy ?? effect.privacy,
    tags: ['istotit', 'variant_istotit', 'shelter_tally', 'document', ...effect.tags],
    data: {
      outcome,
      forged: itemId === FORGED_SHELTER_TALLY_ID,
      consequence: effect.consequence,
      rumorIds: effect.rumorIds,
      containerName: input.container?.name,
      containerAccess: input.container?.access,
      targetName: input.targetName ?? effect.targetName,
    },
  });
}

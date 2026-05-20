import {
  EntityType, Faction, FloorLevel, Occupation,
  type Entity, type GameState, type Item,
  msg,
} from '../core/types';
import { ITEMS } from '../data/catalog';
import { getStack } from '../data/items';
import { addFactionRelMutual } from '../data/relations';
import { publishEvent } from './events';

const ITEM_ID = 'maronary_shaving';
const BASE_TAGS = ['player', 'inventory', 'maronary', 'contraband', 'evidence'];

type ShavingOutcome = 'science' | 'cult' | 'ministry' | 'sale';

function shavingDef() {
  return ITEMS[ITEM_ID];
}

function eventTags(...extra: string[]): string[] {
  const tags = [...BASE_TAGS, ...extra];
  const def = shavingDef();
  for (const tag of def?.tags ?? []) if (!tags.includes(tag)) tags.push(tag);
  return tags;
}

function removeOneFromSlot(inv: Item[], slotIdx: number): boolean {
  const slot = inv[slotIdx];
  if (!slot || slot.defId !== ITEM_ID || slot.count <= 0) return false;
  slot.count--;
  if (slot.count <= 0) inv.splice(slotIdx, 1);
  return true;
}

function addToNpcInventory(npc: Entity): boolean {
  if (!npc.inventory) npc.inventory = [];
  const def = shavingDef();
  if (!def) return false;
  const maxStack = getStack(def);
  for (const slot of npc.inventory) {
    if (slot.defId !== ITEM_ID || slot.count >= maxStack || slot.data !== undefined) continue;
    slot.count++;
    return true;
  }
  if (npc.inventory.length >= 25) return false;
  npc.inventory.push({ defId: ITEM_ID, count: 1 });
  return true;
}

function classifyBuyer(npc: Entity, state: GameState): ShavingOutcome {
  if (npc.plotNpcId === 'yakov' || npc.faction === Faction.SCIENTIST || npc.occupation === Occupation.SCIENTIST) return 'science';
  if (npc.faction === Faction.CULTIST || npc.occupation === Occupation.PILGRIM || npc.occupation === Occupation.PRIEST) return 'cult';
  if (
    state.currentFloor === FloorLevel.MINISTRY
    && (
      npc.plotNpcId === 'rotenbergov'
      || npc.plotNpcId === 'khrushchev'
      || npc.occupation === Occupation.DIRECTOR
      || npc.occupation === Occupation.SECRETARY
      || npc.faction === Faction.CITIZEN
    )
  ) return 'ministry';
  return 'sale';
}

function rewardFor(outcome: ShavingOutcome): number {
  switch (outcome) {
    case 'science': return 280;
    case 'cult': return 320;
    case 'ministry': return 240;
    case 'sale': return 190;
  }
}

function relationConsequence(outcome: ShavingOutcome): void {
  switch (outcome) {
    case 'science':
      addFactionRelMutual(Faction.PLAYER, Faction.SCIENTIST, 6);
      addFactionRelMutual(Faction.PLAYER, Faction.CULTIST, -2);
      return;
    case 'cult':
      addFactionRelMutual(Faction.PLAYER, Faction.CULTIST, 7);
      addFactionRelMutual(Faction.PLAYER, Faction.SCIENTIST, -4);
      return;
    case 'ministry':
      addFactionRelMutual(Faction.PLAYER, Faction.CITIZEN, -2);
      addFactionRelMutual(Faction.PLAYER, Faction.SCIENTIST, -2);
      return;
    case 'sale':
      addFactionRelMutual(Faction.PLAYER, Faction.CITIZEN, -1);
      return;
  }
}

function handoffText(outcome: ShavingOutcome, npcName: string, reward: number): string {
  switch (outcome) {
    case 'science':
      return npcName === 'Яков Давидович'
        ? `Яков спрятал зелёную стружку отдельно от бумаг: «Это не покупка, это изъятие из логики». +${reward}₽`
        : `${npcName} купил стружку для НИИ и сразу спросил, какая дверь повторилась. +${reward}₽`;
    case 'cult':
      return `${npcName} принял зелёную стружку как возвращённый слог стены. Деньги отсчитаны без взгляда в глазок. +${reward}₽`;
    case 'ministry':
      return `${npcName} оформил стружку как зелёный инцидент. Продажа звучит как признание маршрута. +${reward}₽`;
    case 'sale':
      return `${npcName} купил стружку и завернул её дважды. Теперь вопрос купил вас обратно и знает вашу дверь. +${reward}₽`;
  }
}

export function destroyMaronaryShaving(actor: Entity, state: GameState | undefined): string {
  if (actor.rpg) actor.rpg.psi = Math.max(0, actor.rpg.psi - 6);
  else if (actor.hp !== undefined) actor.hp = Math.max(1, actor.hp - 2);

  if (state && actor.type === EntityType.PLAYER) {
    const def = shavingDef();
    publishEvent(state, {
      type: 'player_destroy_item',
      actorId: actor.id,
      actorName: actor.name ?? 'Вы',
      actorFaction: actor.faction,
      itemId: ITEM_ID,
      itemName: def?.name ?? ITEM_ID,
      itemCount: 1,
      itemValue: def?.value ?? 0,
      severity: 4,
      privacy: 'local',
      tags: eventTags('destroyed', 'sample'),
      data: {
        outcome: 'destroyed',
        psiCost: actor.rpg ? 6 : 0,
        hpCost: actor.rpg ? 0 : 2,
        rumorIds: ['samosbor_maronary_shaving_hidden'],
      },
    });
  }

  return actor.rpg
    ? 'Стружка рассыпалась в серую пыль. Писк доказал ошибку: ПСИ -6.'
    : 'Стружка рассыпалась в серую пыль. Пальцы саднит, но документы молчат: HP -2.';
}

export function publishMaronaryShavingAcquired(actor: Entity, state: GameState, source: string): void {
  if (actor.type !== EntityType.PLAYER) return;
  const def = shavingDef();
  publishEvent(state, {
    type: 'player_pick_item',
    actorId: actor.id,
    actorName: actor.name ?? 'Вы',
    actorFaction: actor.faction,
    itemId: ITEM_ID,
    itemName: def?.name ?? ITEM_ID,
    itemCount: 1,
    itemValue: def?.value ?? 0,
    severity: 3,
    privacy: 'local',
    tags: eventTags('acquire', source),
    data: {
      source,
      rumorIds: ['samosbor_maronary_shaving'],
    },
  });
}

export function tryHandleMaronaryShavingHandoff(
  player: Entity,
  npc: Entity,
  slotIdx: number,
  state: GameState,
): boolean {
  const inv = player.inventory;
  const slot = inv?.[slotIdx];
  if (!inv || !slot || slot.defId !== ITEM_ID) return false;
  if (!addToNpcInventory(npc)) {
    state.msgs.push(msg(`${npc.name ?? 'Покупатель'} некуда спрятать стружку отдельно от документов.`, state.time, '#f84'));
    return true;
  }
  if (!removeOneFromSlot(inv, slotIdx)) return false;

  const outcome = classifyBuyer(npc, state);
  const reward = rewardFor(outcome);
  const def = shavingDef();
  player.money = (player.money ?? 0) + reward;
  relationConsequence(outcome);

  const npcName = npc.name ?? 'Покупатель';
  state.msgs.push(msg(
    handoffText(outcome, npcName, reward),
    state.time,
    outcome === 'cult' ? '#c8f' : outcome === 'ministry' ? '#fa0' : '#8cf',
  ));
  publishEvent(state, {
    type: outcome === 'sale' ? 'player_sell_item' : 'player_handoff_item',
    actorId: player.id,
    actorName: player.name ?? 'Вы',
    actorFaction: player.faction,
    targetId: npc.id,
    targetName: npcName,
    targetFaction: npc.faction,
    itemId: ITEM_ID,
    itemName: def?.name ?? ITEM_ID,
    itemCount: 1,
    itemValue: reward,
    severity: outcome === 'sale' ? 3 : 4,
    privacy: outcome === 'sale' ? 'local' : 'witnessed',
    tags: eventTags('handoff', outcome),
    data: {
      outcome,
      buyerPlotNpcId: npc.plotNpcId,
      reward,
      rumorIds: outcome === 'cult'
        ? ['samosbor_maronary_cult_buyer']
        : outcome === 'ministry'
          ? ['samosbor_maronary_ministry_buyer']
          : ['samosbor_maronary_shaving'],
    },
  });
  return true;
}

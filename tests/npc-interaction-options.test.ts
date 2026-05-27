import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { FloorLevel, ItemType } from '../src/core/types';
import { ITEMS } from '../src/data/catalog';
import {
  activateNpcCustomMenuOption,
  CARD_DECK_ITEM_ID,
  closeNpcInteractionInterface,
  DICE_BONE_ITEM_ID,
  getNpcInteractionInterfaceSnapshot,
  getNpcMenuOptions,
} from '../src/systems/npc_interaction_options';
import { getDiceSnapshot } from '../src/systems/dice';
import { getDurakSnapshot } from '../src/systems/durak';
import { makeGameState, makeTestNpc, makeTestPlayer } from './helpers';

function optionIds(options: ReturnType<typeof getNpcMenuOptions>): string[] {
  return options.map(option => option.id);
}

test('default NPC menu keeps barter inside the single trade option', () => {
  const state = makeGameState();
  const player = makeTestPlayer();
  const npc = makeTestNpc();
  const ids = optionIds(getNpcMenuOptions({ state, player, npc }));

  assert.equal(ids.includes('trade'), true);
  assert.equal(ids.includes('barter'), false);
});

test('card deck is a non-active inventory item for NPC menu affordances', () => {
  const def = ITEMS[CARD_DECK_ITEM_ID];
  assert.ok(def);
  assert.equal(def.type, ItemType.MISC);
  assert.equal(typeof def.use, 'undefined');
  assert.equal(def.name, 'Колода карт');
  assert.ok(def.spawnRooms.length > 0);
  assert.ok(def.spawnW > 0);
  assert.ok(def.value > 0);
  assert.ok(def.tags?.includes('durak'));
  assert.equal(def.tags?.includes('gambling'), false);
});

test('bone dice are a non-active inventory item for NPC menu affordances', () => {
  const def = ITEMS[DICE_BONE_ITEM_ID];
  assert.ok(def);
  assert.equal(def.type, ItemType.MISC);
  assert.equal(typeof def.use, 'undefined');
  assert.equal(def.name, 'Игральные кости');
  assert.ok(def.spawnRooms.length > 0);
  assert.ok(def.spawnW > 0);
  assert.ok(def.value > 0);
  assert.ok(def.tags?.includes('gambling'));
});

test('durak NPC menu option requires a card deck on either side and player stake money', () => {
  const state = makeGameState();
  const player = makeTestPlayer({ money: 10, inventory: [] });
  const npc = makeTestNpc({ money: 100, inventory: [] });

  assert.equal(optionIds(getNpcMenuOptions({ state, player, npc })).includes('durak'), false);

  npc.inventory = [{ defId: CARD_DECK_ITEM_ID, count: 1 }];
  const options = getNpcMenuOptions({ state, player, npc });
  const durak = options.find(option => option.id === 'durak');
  assert.ok(durak);
  assert.equal(durak.disabled, false);
  assert.equal(durak.label, 'Играть в дурака (₽10)');

  player.money = 9;
  const blocked = getNpcMenuOptions({ state, player, npc }).find(option => option.id === 'durak');
  assert.equal(blocked?.disabled, true);
  assert.match(blocked?.disabledReason ?? '', /Нужно ₽10/);
});

test('dice NPC menu option requires bone dice on either side and player stake money', () => {
  const state = makeGameState();
  const player = makeTestPlayer({ money: 10, inventory: [] });
  const npc = makeTestNpc({ money: 100, inventory: [] });

  assert.equal(optionIds(getNpcMenuOptions({ state, player, npc })).includes('dice'), false);

  player.inventory = [{ defId: DICE_BONE_ITEM_ID, count: 1 }];
  let dice = getNpcMenuOptions({ state, player, npc }).find(option => option.id === 'dice');
  assert.ok(dice);
  assert.equal(dice.disabled, false);
  assert.equal(dice.label, 'Играть в кости (₽10)');

  player.inventory = [];
  npc.inventory = [{ defId: DICE_BONE_ITEM_ID, count: 1 }];
  dice = getNpcMenuOptions({ state, player, npc }).find(option => option.id === 'dice');
  assert.ok(dice);
  assert.equal(dice.disabled, false);

  player.money = 9;
  const blocked = getNpcMenuOptions({ state, player, npc }).find(option => option.id === 'dice');
  assert.equal(blocked?.disabled, true);
  assert.match(blocked?.disabledReason ?? '', /Нужно ₽10/);
});

test('durak option opens a playable NPC interface without charging money until result', () => {
  closeNpcInteractionInterface();
  const state = makeGameState({ time: 5 });
  const player = makeTestPlayer({ money: 20, inventory: [{ defId: CARD_DECK_ITEM_ID, count: 1 }] });
  const npc = makeTestNpc({ id: 7, name: 'Игрок у кухни', money: 100, inventory: [] });

  assert.equal(activateNpcCustomMenuOption({ state, player, npc }, 'durak'), true);
  const snapshot = getNpcInteractionInterfaceSnapshot();
  assert.equal(snapshot.open, true);
  assert.equal(snapshot.id, 'durak');
  assert.equal(snapshot.npcId, 7);
  assert.equal(snapshot.stakeRubles, 10);
  assert.equal(getDurakSnapshot().open, true);
  assert.equal(player.money, 20);
  assert.equal(npc.money, 100);

  closeNpcInteractionInterface(state);
});

test('dice option opens a playable NPC interface without charging money until result', () => {
  closeNpcInteractionInterface();
  const state = makeGameState({ time: 5 });
  const player = makeTestPlayer({ money: 20, inventory: [{ defId: DICE_BONE_ITEM_ID, count: 1 }] });
  const npc = makeTestNpc({ id: 8, name: 'Игрок с костями', money: 100, inventory: [] });

  assert.equal(activateNpcCustomMenuOption({ state, player, npc }, 'dice'), true);
  const snapshot = getNpcInteractionInterfaceSnapshot();
  assert.equal(snapshot.open, true);
  assert.equal(snapshot.id, 'dice');
  assert.equal(snapshot.npcId, 8);
  assert.equal(snapshot.stakeRubles, 10);
  assert.equal(getDiceSnapshot().open, true);
  assert.equal(player.money, 20);
  assert.equal(npc.money, 100);

  closeNpcInteractionInterface(state);
  assert.equal(getDiceSnapshot().open, false);
});

test('floor 69 entertainment option is route and worker gated', () => {
  const state = makeGameState({ currentFloor: FloorLevel.MAINTENANCE });
  (state as unknown as { floorRun: { runSeed: number; currentZ: number; specs: Record<string, never>; visited: Record<string, boolean> } }).floorRun = {
    runSeed: 69,
    currentZ: -4,
    specs: {},
    visited: {},
  };
  const player = makeTestPlayer({ money: 45 });
  const worker = makeTestNpc({ id: 69, name: 'Ира Сцена', plotNpcId: 'f69_performer_ira', money: 28 });
  const visitor = makeTestNpc({ id: 70, name: 'Посетитель у лампы', money: 28 });

  const workerOption = getNpcMenuOptions({ state, player, npc: worker }).find(option => option.id === 'floor69_entertainment');
  assert.ok(workerOption);
  assert.equal(workerOption.disabled, false);
  assert.equal(workerOption.label, 'Развлечься (₽45)');
  assert.equal(optionIds(getNpcMenuOptions({ state, player, npc: visitor })).includes('floor69_entertainment'), false);

  assert.equal(activateNpcCustomMenuOption({ state, player, npc: worker }, 'floor69_entertainment'), true);
  const snapshot = getNpcInteractionInterfaceSnapshot();
  assert.equal(snapshot.open, true);
  assert.equal(snapshot.id, 'floor69_entertainment');
  assert.equal(snapshot.priceRubles, 45);
  assert.equal(player.money, 45);
  closeNpcInteractionInterface(state);
});

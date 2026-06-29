import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { EntityType, FloorLevel, type Entity, type GameState } from '../src/core/types';
import { MAX_INVENTORY_SLOTS } from '../src/data/inventory_limits';
import {
  financeDetailLines,
  hasInventoryRoom,
  readFinanceSnapshot,
  tradePriceDisplay,
  tradeCellPriceDisplay,
} from '../src/render/economy_ui';

function state(extra: Partial<GameState> & Record<string, unknown> = {}): GameState {
  return {
    time: 0,
    currentFloor: FloorLevel.LIVING,
    ...extra,
  } as GameState;
}

function entity(extra: Partial<Entity> = {}): Entity {
  return {
    id: 1,
    type: EntityType.NPC, persistentNpcId: 'player',
    x: 0,
    y: 0,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 1,
    sprite: 0,
    ...extra,
  };
}

test('finance UI falls back to cash when optional systems are absent', () => {
  const player = entity({ money: 73 });
  const snapshot = readFinanceSnapshot(player, state());
  assert.equal(snapshot.cash, 73);
  assert.equal(snapshot.hasBanking, false);
  assert.equal(snapshot.hasStock, false);
  assert.deepEqual(financeDetailLines(snapshot).map(line => line.text), ['Наличные: 73₽']);
});

test('finance UI reads optional banking and stock state defensively', () => {
  const player = entity({ money: 9 });
  const snapshot = readFinanceSnapshot(player, state({
    time: 86400,
    banking: {
      accountRubles: 240,
      depositPrincipal: 1000,
      depositRate: 0.365,
      depositOpenedAt: 0,
      loanPrincipal: 80,
      loanAccrued: 7,
      creditLimit: 500,
    },
    stockMarket: {
      quotes: { toha_heavy_industries: { price: 15 } },
      portfolio: { toha_heavy_industries: { shares: 4, avgPrice: 10 } },
    },
  }));

  assert.equal(snapshot.accountRubles, 240);
  assert.equal(snapshot.debtRubles, 87);
  assert.equal(Math.round(snapshot.depositYield), 1);
  assert.equal(snapshot.portfolioValue, 60);
  assert.equal(snapshot.portfolioPL, 20);

  const lines = financeDetailLines(snapshot).map(line => line.text);
  assert.ok(lines.some(line => line.startsWith('Счет: 240₽')));
  assert.ok(lines.some(line => line.startsWith('Долг: 87₽')));
  assert.ok(lines.some(line => line === 'Портфель: 60₽'));
  assert.ok(lines.some(line => line === 'Акции P/L: +20₽'));
});

test('trade price display includes fallback price reason and affordability status', () => {
  const player = entity({ money: 0, inventory: [] });
  const npc = entity({ id: 2, type: EntityType.NPC, money: 100, inventory: [{ defId: 'water', count: 1 }] });
  const display = tradePriceDisplay(state(), player, npc, 'water', 'buy');

  assert.match(display.line, /^Цена: \d+₽ спрос x[\d.]+ дефицит x/);
  assert.equal(display.ok, false);
  assert.equal(display.status, 'не хватает денег');
});

test('inventory room check treats existing stacks as space', () => {
  assert.equal(hasInventoryRoom([{ defId: 'water', count: 1 }], 'water'), true);
  assert.equal(hasInventoryRoom(Array.from({ length: MAX_INVENTORY_SLOTS }, (_, i) => ({ defId: `missing_${i}`, count: 1 })), 'water'), false);
});


test('inventory room check handles undefined and empty inventories', () => {
  assert.equal(hasInventoryRoom(undefined, 'water'), true);
  assert.equal(hasInventoryRoom([], 'water'), true);
});

test('inventory room check handles missing or invalid item definitions', () => {
  assert.equal(hasInventoryRoom([], 'non_existent_item_id_123'), false);
});

test('inventory room check respects stack limits and custom data', () => {
  const fullInv = Array.from({ length: MAX_INVENTORY_SLOTS }, (_, i) => ({ defId: `junk_${i}`, count: 1 }));

  // Full inventory, no water
  assert.equal(hasInventoryRoom(fullInv, 'water'), false);

  // Full inventory, but one slot is a full water stack (255)
  const invWithFullWater = [...fullInv];
  invWithFullWater[0] = { defId: 'water', count: 255 };
  assert.equal(hasInventoryRoom(invWithFullWater, 'water'), false);

  // Full inventory, one slot is water but has custom data
  const invWithCustomWater = [...fullInv];
  invWithCustomWater[0] = { defId: 'water', count: 1, data: { custom: true } };
  assert.equal(hasInventoryRoom(invWithCustomWater, 'water'), false);

  // Full inventory, one slot is available water stack
  const invWithAvailableWater = [...fullInv];
  invWithAvailableWater[0] = { defId: 'water', count: 10 };
  assert.equal(hasInventoryRoom(invWithAvailableWater, 'water'), true);
});

test('inventory room check handles items with explicit small stack limits', () => {
  // water_filter_regulator has stack: 3
  const fullInv = Array.from({ length: MAX_INVENTORY_SLOTS }, (_, i) => ({ defId: `junk_${i}`, count: 1 }));

  const invWithFilter = [...fullInv];
  invWithFilter[0] = { defId: 'water_filter_regulator', count: 2 };
  assert.equal(hasInventoryRoom(invWithFilter, 'water_filter_regulator'), true);

  const invWithFullFilter = [...fullInv];
  invWithFullFilter[0] = { defId: 'water_filter_regulator', count: 3 };
  assert.equal(hasInventoryRoom(invWithFullFilter, 'water_filter_regulator'), false);
});

test('trade UI gracefully falls back when economy quote system throws error', () => {
  const s = state({ quests: [] });
  const player = entity();
  const badNpc = entity();

  Object.defineProperty(badNpc, 'faction', {
    get() {
      throw new Error('Simulated economy crash during quote');
    }
  });

  const cellDisplay = tradeCellPriceDisplay(s, badNpc, 'water', 'buy');
  assert.equal(typeof cellDisplay.text, 'string');
  assert.ok(cellDisplay.text.endsWith('₽'));

  const tradeDisplay = tradePriceDisplay(s, player, badNpc, 'water', 'buy');
  assert.equal(typeof tradeDisplay.line, 'string');
  assert.ok(tradeDisplay.line.includes('Цена:'));
});

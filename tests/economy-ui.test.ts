import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { EntityType, FloorLevel, type Entity, type GameState } from '../src/core/types';
import { MAX_INVENTORY_SLOTS } from '../src/data/inventory_limits';
import {
  financeDetailLines,
  hasInventoryRoom,
  readFinanceSnapshot,
  scarcityBand,
  tradePriceDisplay,
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

test('scarcityBand calculations', async (t) => {
  await t.test('handles non-finite numbers', () => {
    assert.equal(scarcityBand(NaN).label, 'НОРМА');
    assert.equal(scarcityBand(Infinity).label, 'НОРМА');
    assert.equal(scarcityBand(-Infinity).label, 'НОРМА');
  });

  await t.test('handles КРИЗИС band (m >= 2.05)', () => {
    assert.equal(scarcityBand(2.05).label, 'КРИЗИС');
    assert.equal(scarcityBand(3.0).label, 'КРИЗИС');
  });

  await t.test('handles ДЕФИЦИТ band (m >= 1.35)', () => {
    assert.equal(scarcityBand(1.35).label, 'ДЕФИЦИТ');
    assert.equal(scarcityBand(1.5).label, 'ДЕФИЦИТ');
    assert.equal(scarcityBand(2.04).label, 'ДЕФИЦИТ');
  });

  await t.test('handles НАПРЯЖ. band (m >= 1.12)', () => {
    assert.equal(scarcityBand(1.12).label, 'НАПРЯЖ.');
    assert.equal(scarcityBand(1.2).label, 'НАПРЯЖ.');
    assert.equal(scarcityBand(1.34).label, 'НАПРЯЖ.');
  });

  await t.test('handles ИЗБЫТОК band (m <= 0.72)', () => {
    assert.equal(scarcityBand(0.72).label, 'ИЗБЫТОК');
    assert.equal(scarcityBand(0.5).label, 'ИЗБЫТОК');
    assert.equal(scarcityBand(0.0).label, 'ИЗБЫТОК');
    assert.equal(scarcityBand(-1.0).label, 'ИЗБЫТОК');
  });

  await t.test('handles ЗАПАС band (m <= 0.88)', () => {
    assert.equal(scarcityBand(0.88).label, 'ЗАПАС');
    assert.equal(scarcityBand(0.8).label, 'ЗАПАС');
    assert.equal(scarcityBand(0.73).label, 'ЗАПАС');
  });

  await t.test('handles НОРМА band (0.88 < m < 1.12)', () => {
    assert.equal(scarcityBand(1).label, 'НОРМА');
    assert.equal(scarcityBand(0.89).label, 'НОРМА');
    assert.equal(scarcityBand(1.11).label, 'НОРМА');
  });
});

import { test } from 'node:test';
import assert from 'node:assert';
import { formatLastPlayerDamageCause } from '../../src/systems/damage';
import type { GameState } from '../../src/core/types';

test('formatLastPlayerDamageCause', async (t) => {
  await t.test('returns undefined when state is undefined', () => {
    assert.strictEqual(formatLastPlayerDamageCause(undefined, 100), undefined);
  });

  await t.test('returns undefined when state.lastDamage is undefined', () => {
    const state = {} as GameState;
    assert.strictEqual(formatLastPlayerDamageCause(state, 100), undefined);
  });

  await t.test('returns undefined when damage is too old (time < deathTime - 4)', () => {
    const state = {
      lastDamage: {
        time: 90,
        tick: 1,
        amount: 10,
        sourceKind: 'monster',
        sourceName: 'монстр',
      }
    } as GameState;
    assert.strictEqual(formatLastPlayerDamageCause(state, 100), undefined);
  });

  await t.test('returns undefined when damage is in the future (time > deathTime + 1.5)', () => {
    const state = {
      lastDamage: {
        time: 105,
        tick: 1,
        amount: 10,
        sourceKind: 'monster',
        sourceName: 'монстр',
      }
    } as GameState;
    assert.strictEqual(formatLastPlayerDamageCause(state, 100), undefined);
  });

  await t.test('returns detail string when present', () => {
    const state = {
      lastDamage: {
        time: 98,
        tick: 1,
        amount: 10,
        sourceKind: 'monster',
        sourceName: 'монстр',
        detail: 'монстр: -10.0',
      }
    } as GameState;
    assert.strictEqual(formatLastPlayerDamageCause(state, 100), 'монстр: -10.0');
  });

  await t.test('returns formatted fallback when detail is undefined', () => {
    const state = {
      lastDamage: {
        time: 98,
        tick: 1,
        amount: 10,
        sourceKind: 'monster',
        sourceName: 'монстр',
      }
    } as GameState;
    assert.strictEqual(formatLastPlayerDamageCause(state, 100), 'монстр: -10');
  });
});

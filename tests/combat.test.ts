import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { calculateDamage } from '../src/systems/combat';

test('calculateDamage subtracts armor from base damage', () => {
  assert.equal(calculateDamage(10, 3), 7);
});

test('calculateDamage clamps to 0 when armor exceeds base damage', () => {
  assert.equal(calculateDamage(5, 8), 0);
});

test('calculateDamage handles negative base damage correctly by clamping to 0', () => {
  assert.equal(calculateDamage(-5, 2), 0);
});

test('calculateDamage returns 0 if both values are 0', () => {
  assert.equal(calculateDamage(0, 0), 0);
});

test('calculateDamage correctly calculates damage when armor is 0', () => {
  assert.equal(calculateDamage(15, 0), 15);
});

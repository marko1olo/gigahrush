import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { xorshift32, pickFrom } from '../src/core/rand';

test('xorshift32 produces deterministic sequence for a given seed', () => {
  const rng1 = xorshift32(12345);
  const rng2 = xorshift32(12345);

  for (let i = 0; i < 10; i++) {
    assert.equal(rng1(), rng2());
  }
});

test('xorshift32 handles zero seed by falling back to 1', () => {
  const rngZero = xorshift32(0);
  const rngOne = xorshift32(1);

  for (let i = 0; i < 10; i++) {
    assert.equal(rngZero(), rngOne());
  }
});

test('xorshift32 handles negative and fractional seeds with bitwise truncation', () => {
  const rngNegative = xorshift32(-1.5);
  const expectedSeed = (-1.5) | 0; // -1
  const rngExpected = xorshift32(expectedSeed);

  for (let i = 0; i < 10; i++) {
    assert.equal(rngNegative(), rngExpected());
  }
});

test('xorshift32 generated values are exclusively within [0, 1)', () => {
  const rng = xorshift32(9999);
  for (let i = 0; i < 1000; i++) {
    const val = rng();
    assert.ok(val >= 0);
    assert.ok(val < 1);
  }
});

test('xorshift32 produces the known exact sequence for seed 1', () => {
  const rng = xorshift32(1);

  // The first 5 integer values generated before division
  const expectedInts = [
    270369,
    67634689,
    2647435461,
    307599695,
    2398689233,
  ];

  for (let i = 0; i < expectedInts.length; i++) {
    const val = rng();
    const intVal = Math.round(val * 4294967296); // Reverse the division
    assert.equal(intVal, expectedInts[i]);
  }
});

test('pickFrom selects the correct element based on RandomSource', () => {
  const items = ['a', 'b', 'c', 'd'];

  // 0 * 4 = 0 -> 'a'
  assert.equal(pickFrom(() => 0, items), 'a');

  // 0.25 * 4 = 1 -> 'b'
  assert.equal(pickFrom(() => 0.25, items), 'b');

  // 0.5 * 4 = 2 -> 'c'
  assert.equal(pickFrom(() => 0.5, items), 'c');

  // 0.75 * 4 = 3 -> 'd'
  assert.equal(pickFrom(() => 0.75, items), 'd');

  // 0.999 * 4 = 3.996 -> 3 -> 'd'
  assert.equal(pickFrom(() => 0.999, items), 'd');
});

test('pickFrom returns undefined for empty arrays', () => {
  const items: string[] = [];
  assert.equal(pickFrom(() => 0.5, items), undefined);
});

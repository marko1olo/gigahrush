import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { xorshift32, withSeededRandom } from '../src/core/rand';

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

test('withSeededRandom returns the result of the callback', () => {
  const result = withSeededRandom(123, () => 'success');
  assert.equal(result, 'success');
});

test('withSeededRandom deterministically substitutes Math.random and restores it', () => {
  const originalMathRandom = Math.random;
  const seed = 12345;
  const expectedRng = xorshift32(seed);

  const generatedValues: number[] = [];

  withSeededRandom(seed, () => {
    assert.notEqual(Math.random, originalMathRandom);
    for (let i = 0; i < 5; i++) {
      generatedValues.push(Math.random());
    }
  });

  assert.equal(Math.random, originalMathRandom);

  for (const val of generatedValues) {
    assert.equal(val, expectedRng());
  }
});

test('withSeededRandom restores Math.random even if callback throws', () => {
  const originalMathRandom = Math.random;
  const seed = 999;

  assert.throws(() => {
    withSeededRandom(seed, () => {
      assert.notEqual(Math.random, originalMathRandom);
      throw new Error('Test error');
    });
  }, { message: 'Test error' });

  assert.equal(Math.random, originalMathRandom);
});

import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { xorshift32, secureRandom } from '../src/core/rand';

test('secureRandom generates values exclusively within [0, 1)', () => {
  for (let i = 0; i < 1000; i++) {
    const val = secureRandom();
    assert.ok(val >= 0, `Value ${val} should be >= 0`);
    assert.ok(val < 1, `Value ${val} should be < 1`);
  }
});

test('secureRandom calls crypto.getRandomValues and computes correct float', () => {
  const originalGetRandomValues = globalThis.crypto.getRandomValues;
  let callCount = 0;

  try {
    globalThis.crypto.getRandomValues = (array: any) => {
      callCount++;
      if (array instanceof Uint32Array) {
        array[0] = 2147483648; // half of 4294967296
      }
      return array;
    };

    const val = secureRandom();
    assert.equal(callCount, 1, 'crypto.getRandomValues should be called once');
    assert.equal(val, 0.5, 'Expected 2147483648 / 4294967296 = 0.5');
  } finally {
    globalThis.crypto.getRandomValues = originalGetRandomValues;
  }
});

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

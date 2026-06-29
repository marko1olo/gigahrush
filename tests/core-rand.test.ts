import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { xorshift32, irandFrom } from '../src/core/rand';

test('irandFrom returns lower bound when RandomSource returns 0', () => {
  const randZero = () => 0;
  assert.equal(irandFrom(randZero, 1, 10), 1);
  assert.equal(irandFrom(randZero, 5, 20), 5);
});

test('irandFrom returns upper bound when RandomSource returns almost 1', () => {
  const randAlmostOne = () => 0.999999999999999;
  assert.equal(irandFrom(randAlmostOne, 1, 10), 10);
  assert.equal(irandFrom(randAlmostOne, 5, 20), 20);
});

test('irandFrom handles negative ranges correctly', () => {
  const randZero = () => 0;
  const randAlmostOne = () => 0.999999999999999;
  const randHalf = () => 0.5;
  assert.equal(irandFrom(randZero, -10, -1), -10);
  assert.equal(irandFrom(randAlmostOne, -10, -1), -1);
  assert.equal(irandFrom(randHalf, -10, -1), -5);

  assert.equal(irandFrom(randZero, -5, 5), -5);
  assert.equal(irandFrom(randAlmostOne, -5, 5), 5);
  assert.equal(irandFrom(randHalf, -5, 5), 0);
});

test('irandFrom handles equal bounds correctly', () => {
  const randZero = () => 0;
  const randAlmostOne = () => 0.999999999999999;
  const randHalf = () => 0.5;

  assert.equal(irandFrom(randZero, 5, 5), 5);
  assert.equal(irandFrom(randAlmostOne, 5, 5), 5);
  assert.equal(irandFrom(randHalf, 5, 5), 5);
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

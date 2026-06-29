import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  xorshift32,
  SeedRng,
  randSeed,
  irand,
  irandFrom,
  pickFrom,
  shuffleWith,
  hashSeed,
  seededRandom,
  withSeededRandom,
  secureRandom,
} from '../src/core/rand';

test('xorshift32 produces deterministic sequence for a given seed', () => {
  const rng1 = xorshift32(12345);
  const rng2 = xorshift32(12345);

  for (let i = 0; i < 10; i++) {
    assert.equal(rng1(), rng2());
  }
});

test('xorshift32 handles zero seed by falling back to 1', () => {
  const rngZero = xorshift32(0);
  const rngMinusZero = xorshift32(-0);
  const rngNaN = xorshift32(NaN);
  const rngOne = xorshift32(1);

  for (let i = 0; i < 20; i++) {
    const expected = rngOne();
    assert.equal(rngZero(), expected);
    assert.equal(rngMinusZero(), expected);
    assert.equal(rngNaN(), expected);
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

test('SeedRng handles zero seed by falling back to 1', () => {
  const rngZero = new SeedRng(0);
  const rngOne = new SeedRng(1);
  for (let i = 0; i < 10; i++) {
    assert.equal(rngZero.random(), rngOne.random());
  }
});

test('SeedRng produces deterministic values and methods work', () => {
  const rng = new SeedRng(12345);
  assert.equal(typeof rng.nextU32(), 'number');
  assert.equal(typeof rng.random(), 'number');

  const intVal = rng.int(10, 20);
  assert.ok(intVal >= 10 && intVal <= 20);

  const floatVal = rng.float(1.5, 2.5);
  assert.ok(floatVal >= 1.5 && floatVal < 2.5);

  const chanceVal = rng.chance(0.5);
  assert.equal(typeof chanceVal, 'boolean');

  const items = ['a', 'b', 'c'];
  const picked = rng.pick(items);
  assert.ok(items.includes(picked));

  const shuffled = rng.shuffle([...items]);
  assert.equal(shuffled.length, 3);
  assert.ok(shuffled.includes('a'));
});

test('randSeed generates valid seed', () => {
  const s = randSeed();
  assert.ok(s >= 0 && s < 99999);
});

test('irand generates within range', () => {
  const v = irand(5, 10);
  assert.ok(v >= 5 && v <= 10);
});

test('irandFrom generates within range using explicit source', () => {
  const rng = xorshift32(42);
  const v = irandFrom(rng, 5, 10);
  assert.ok(v >= 5 && v <= 10);
});

test('pickFrom picks from array', () => {
  const rng = xorshift32(42);
  const items = ['x', 'y'];
  const picked = pickFrom(rng, items);
  assert.ok(items.includes(picked));
});

test('shuffleWith shuffles array', () => {
  const rng = xorshift32(42);
  const items = [1, 2, 3];
  const shuffled = shuffleWith(rng, [...items]);
  assert.equal(shuffled.length, 3);
  assert.ok(shuffled.includes(1));
});

test('hashSeed generates stable hash', () => {
  const h1 = hashSeed('hello', 0);
  const h2 = hashSeed('hello', 0);
  const h3 = hashSeed('hello', 1);
  assert.equal(h1, h2);
  assert.notEqual(h1, h3);
});

test('seededRandom produces deterministic sequence', () => {
  const rng1 = seededRandom(42);
  const rng2 = seededRandom(42);
  assert.equal(rng1(), rng2());
});

test('seededRandom handles zero seed edge case', () => {
  const rng0 = seededRandom(0);
  assert.equal(typeof rng0(), 'number');
});

test('withSeededRandom sets and restores Math.random', () => {
  const originalRandom = Math.random;
  const val = withSeededRandom(123, () => {
    assert.notEqual(Math.random, originalRandom);
    return Math.random();
  });
  assert.equal(Math.random, originalRandom);
  assert.equal(typeof val, 'number');
});

test('secureRandom generates float in [0, 1)', () => {
  const val = secureRandom();
  assert.ok(val >= 0 && val < 1);
});

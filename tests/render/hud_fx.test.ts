import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { textJitter } from '../../src/render/hud_fx.js';

test('textJitter is deterministic for same time and seed', () => {
  const t = 42.5;
  const seed = 123;
  const res1 = textJitter(t, seed);
  const res2 = textJitter(t, seed);

  assert.deepEqual(res1, res2);
});

test('textJitter produces different results for different seeds', () => {
  const t = 10.0;
  const seed1 = 1;
  const seed2 = 2;

  const res1 = textJitter(t, seed1);
  const res2 = textJitter(t, seed2);

  assert.notDeepEqual(res1, res2);
});

test('textJitter produces different results over significant time changes', () => {
  const t1 = 0.0;
  const t2 = 1.0;
  const seed = 999;

  const res1 = textJitter(t1, seed);
  const res2 = textJitter(t2, seed);

  assert.notDeepEqual(res1, res2);
});

test('textJitter dx and dy stay within expected bounds', () => {
  // We can sample many time points and seeds to verify it doesn't return NaN/Infinity
  // and stays reasonably bounded.
  // drift = sin(phase) * 0.6 => [-0.6, 0.6]
  // jitterX = (hash2 - 0.5) * 1.2 => [-0.6, 0.6]
  // max dx = [-1.2, 1.2]
  // jitterY = (hash2 - 0.5) * 0.8 => [-0.4, 0.4]
  // max dy = [-0.4, 0.4]

  for (let i = 0; i < 1000; i++) {
    const time = Math.random() * 100;
    const seed = Math.floor(Math.random() * 1000);
    const result = textJitter(time, seed);

    assert.ok(result.dx >= -1.21 && result.dx <= 1.21, `dx out of bounds: ${result.dx}`);
    assert.ok(result.dy >= -0.41 && result.dy <= 0.41, `dy out of bounds: ${result.dy}`);
  }
});

test('textJitter jitter component only updates on discrete time steps', () => {
  // jitterX uses Math.floor(time * 12)
  // jitterY uses Math.floor(time * 10)

  const t1 = 1.0;
  const t2 = 1.01; // time * 10 is 10 and 10.1 (both floor to 10)
  const seed = 42;

  const res1 = textJitter(t1, seed);
  const res2 = textJitter(t2, seed);

  // They should not be perfectly equal because of the continuous 'drift' applied to dx.
  assert.notEqual(res1.dx, res2.dx);
  // However, dy is purely jitterY which uses Math.floor(time * 10), so it should be exactly equal
  // for small enough time changes that don't cross a 0.1 boundary.
  assert.equal(res1.dy, res2.dy);
});

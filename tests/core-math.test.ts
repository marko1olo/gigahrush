import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { clamp } from '../src/core/math';

test('clamp returns the value when it is within the range', () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(0, -5, 5), 0);
  assert.equal(clamp(-3, -10, -1), -3);
});

test('clamp returns the minimum when the value is below the minimum', () => {
  assert.equal(clamp(-1, 0, 10), 0);
  assert.equal(clamp(-20, -10, 0), -10);
  assert.equal(clamp(4, 5, 10), 5);
});

test('clamp returns the maximum when the value is above the maximum', () => {
  assert.equal(clamp(15, 0, 10), 10);
  assert.equal(clamp(5, -10, 0), 0);
  assert.equal(clamp(20, 5, 15), 15);
});

test('clamp handles fractional numbers correctly', () => {
  assert.equal(clamp(3.14, 0.0, 5.0), 3.14);
  assert.equal(clamp(-1.5, 0.0, 5.0), 0.0);
  assert.equal(clamp(6.28, 0.0, 5.0), 5.0);
});

test('clamp handles cases where min and max are the same', () => {
  assert.equal(clamp(5, 10, 10), 10);
  assert.equal(clamp(15, 10, 10), 10);
  assert.equal(clamp(10, 10, 10), 10);
});

test('clamp handles zero correctly', () => {
  assert.equal(clamp(0, 0, 0), 0);
  assert.equal(clamp(0, -1, 1), 0);
  assert.equal(clamp(0, 1, 5), 1);
  assert.equal(clamp(0, -5, -1), -1);
});

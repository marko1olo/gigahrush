import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { radioChessPhaseDanger } from '../src/systems/procedural_anomalies/radio_chess';

test('radio chess phase danger is deterministic for color phases', () => {
  const seed = 11;

  assert.equal(radioChessPhaseDanger(10, 10, 0, seed, 8, 8), true);
  assert.equal(radioChessPhaseDanger(11, 10, 0, seed, 8, 8), false);
  assert.equal(radioChessPhaseDanger(10, 10, 1, seed, 8, 8), false);
  assert.equal(radioChessPhaseDanger(11, 10, 1, seed, 8, 8), true);
});

test('radio chess phase danger supports file, rank, and knight patterns', () => {
  const seed = 8;

  assert.equal(radioChessPhaseDanger(8, 13, 2, seed, 8, 8), false);
  assert.equal(radioChessPhaseDanger(9, 13, 2, seed, 8, 8), true);
  assert.equal(radioChessPhaseDanger(13, 7, 3, seed, 8, 8), false);
  assert.equal(radioChessPhaseDanger(13, 8, 3, seed, 8, 8), true);
  assert.equal(radioChessPhaseDanger(9, 10, 4, seed, 8, 8), false);
  assert.equal(radioChessPhaseDanger(10, 10, 4, seed, 8, 8), true);
});

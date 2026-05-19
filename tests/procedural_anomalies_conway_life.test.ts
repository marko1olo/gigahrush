import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { nextLifeCell } from '../src/systems/procedural_anomalies/conway_life';

test('conway life helper applies B3/S23 rules', () => {
  assert.equal(nextLifeCell(false, 3), true);
  assert.equal(nextLifeCell(false, 2), false);
  assert.equal(nextLifeCell(true, 1), false);
  assert.equal(nextLifeCell(true, 2), true);
  assert.equal(nextLifeCell(true, 3), true);
  assert.equal(nextLifeCell(true, 4), false);
});

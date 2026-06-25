import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { xpForLevel, totalXpForLevel } from '../src/systems/rpg';

test('RPG progression formulas match expected xp bounds', () => {
  // xpForLevel: first level-up at 100, then soft quadratic growth
  assert.equal(xpForLevel(0), 0);
  assert.equal(xpForLevel(1), 0);
  assert.equal(xpForLevel(2), 100);
  assert.equal(xpForLevel(5), 295);
  assert.equal(xpForLevel(10), 1020);

  // totalXpForLevel: Total XP needed to reach a given level (from 0)
  assert.equal(totalXpForLevel(0), 0);
  assert.equal(totalXpForLevel(1), 0);
  assert.equal(totalXpForLevel(2), 100);
  assert.equal(totalXpForLevel(3), 245);
  assert.equal(totalXpForLevel(5), 750);
  assert.equal(totalXpForLevel(10), 4200);
});

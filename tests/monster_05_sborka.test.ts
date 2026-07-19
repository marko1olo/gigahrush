import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { FloorLevel, MonsterKind } from '../src/core/types';
import { DEF, generateSprite } from '../src/entities/sborka';
import { getMonsterEcology } from '../src/data/monster_ecology';

test('sborka definition, ecology, and sprite verify attributes and generation', () => {
  const ecology = getMonsterEcology(MonsterKind.SBORKA);
  const sprite = generateSprite();

  let opaque = 0;
  for (const px of sprite) {
    if ((px >>> 24) !== 0) {
      opaque++;
    }
  }

  assert.equal(DEF.kind, MonsterKind.SBORKA);
  assert.deepEqual(DEF.aiFlags, ['foodBait']);
  assert.deepEqual(DEF.floors, [FloorLevel.MINISTRY, FloorLevel.KVARTIRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE, FloorLevel.HELL]);
  assert.equal(ecology?.rare, false);
  assert.match(DEF.counterplay ?? '', /широком проходе|дешевым выстрелом/i);
  assert.ok(sprite.length >= 1024, 'sprite should have a valid dimension');
  assert.ok(opaque > 150, 'sborka sprite should have a visible body');
});

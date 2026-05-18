import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { FloorLevel, MonsterKind } from '../src/core/types';
import { DEF } from '../src/entities/tube_eel';

test('tube eel remains a water ambusher with dry-edge counterplay', () => {
  assert.equal(DEF.kind, MonsterKind.TUBE_EEL);
  assert.deepEqual(DEF.aiFlags, ['waterStrider']);
  assert.deepEqual(DEF.floors, [FloorLevel.MAINTENANCE]);

  const waterSpeed = DEF.speed * 1.45;
  const drySpeed = DEF.speed * 0.72;
  assert.ok(waterSpeed >= 2.0, 'water lane speed should make it a real ambusher');
  assert.ok(drySpeed <= 1.1, 'dry ground should be meaningful counterplay');
  assert.ok(DEF.hp <= 65, 'dry-edge shooting should not feel like fighting a tank');

  assert.match(DEF.counterplay ?? '', /сух|кромк|мост|вод/);
  assert.match(DEF.lootHint ?? '', /слиз|манометр|труб/);
});

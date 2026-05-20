import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { EntityType, MonsterKind } from '../src/core/types';
import { formatLastPlayerDamageCause, recordPlayerDamage } from '../src/systems/damage';
import { makeGameState, makeTestEntity } from './helpers';

test('last player damage keeps monster source for death cause', () => {
  const state = makeGameState({ time: 42, tick: 123 });
  const monster = makeTestEntity({
    id: 7,
    type: EntityType.MONSTER,
    monsterKind: MonsterKind.TVAR,
    name: 'Тварь из кухни',
  });

  recordPlayerDamage(state, monster, 17);

  assert.equal(formatLastPlayerDamageCause(state, 42), 'Тварь из кухни: -17');
  assert.equal(state.lastDamage?.sourceKind, 'monster');
  assert.equal(state.lastDamage?.sourceId, 7);
});

test('stale player damage is not reused as a death cause', () => {
  const state = makeGameState({ time: 10, tick: 1 });
  const monster = makeTestEntity({ id: 2, type: EntityType.MONSTER, monsterKind: MonsterKind.SBORKA });

  recordPlayerDamage(state, monster, 5);

  assert.equal(formatLastPlayerDamageCause(state, 30), undefined);
});

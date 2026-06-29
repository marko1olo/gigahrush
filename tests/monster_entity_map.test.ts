import test from 'node:test';
import * as assert from 'node:assert';
import { Spr } from '../src/render/sprite_index';
import { EntityType, MonsterKind, ProjType, type Entity } from '../src/core/types';
import { setEntityMap, tryMonsterProjectileStagger } from '../src/systems/ai/monster';
import { makeGameState, makeTestPlayer, makeTestEntity } from './helpers';
import { World } from '../src/core/world';
import { createWorldEventState, getRecentEvents } from '../src/systems/events';

test('setEntityMap injects global map used by AI routines', () => {
  const world = new World();
  const state = makeGameState();
  state.worldEvents = createWorldEventState();

  const player = makeTestPlayer({ id: 1 });
  const monster = makeTestEntity({ id: 2, type: EntityType.MONSTER, monsterKind: MonsterKind.SPORE_CARPET, ai: {} });
  const projectile = makeTestEntity({ id: 3, type: EntityType.PROJECTILE, projType: ProjType.FLAME, ownerId: 999, sprite: Spr.PELLET });

  setEntityMap(new Map<number, Entity>([[player.id, player]]));

  const staggerResult = tryMonsterProjectileStagger(world, state, monster, projectile, player.id);
  assert.equal(staggerResult, true);

  const burnedEvent = getRecentEvents(state, { type: 'spore_carpet_burned' })[0];
  assert.ok(burnedEvent, 'spore_carpet_burned event should be published');
  assert.equal(burnedEvent.targetId, player.id, 'event target should correctly resolve to the player via _entityById map');

  const burnMsg = state.msgs.find(m => m.text.includes('Ковер'));
  assert.ok(burnMsg, 'Expected state.msgs to contain the SPORE_CARPET burn message');
});

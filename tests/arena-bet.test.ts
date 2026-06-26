import test from 'node:test';
import * as assert from 'node:assert/strict';
import { makeGameState, makeTestPlayer, testWorld } from './helpers';
import { openArenaBet, placeArenaBet, resolveArenaBet, getArenaBetOverlaySnapshot } from '../src/systems/arena';
import { EntityType } from '../src/core/types';

test('arena bets: calculates odds and handles money transfer', () => {
  const state = makeGameState();
  const player = makeTestPlayer(state);
  player.money = 1000;

  const c1 = { id: 2, type: EntityType.NPC, hp: 100, rpg: { level: 5 }, weapon: 'some_weapon' } as any;
  const c2 = { id: 3, type: EntityType.NPC, hp: 50, rpg: { level: 2 } } as any;

  openArenaBet(state, 'test_arena', c1, c2);

  let snap = getArenaBetOverlaySnapshot(player);
  assert.ok(snap.open);
  assert.equal(snap.odds1, 1.5);
  assert.equal(snap.odds2, 3.0);

  assert.equal(player.money, 1000);
  const placed = placeArenaBet(state, player);
  assert.ok(placed);
  assert.equal(player.money, 990);

  resolveArenaBet(state, player, c1.id);
  assert.equal(player.money, 990 + 15);
});

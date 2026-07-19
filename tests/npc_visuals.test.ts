import test from 'node:test';
import assert from 'node:assert/strict';
import { isNpcSpecialSprite } from '../src/entities/npc_visuals';
import { Spr } from '../src/render/sprite_index';

test('isNpcSpecialSprite', async (t) => {
  await t.test('returns false for undefined', () => {
    assert.equal(isNpcSpecialSprite(undefined), false);
  });

  await t.test('returns true for authored NPC sprites', () => {
    // authored sprites start at Spr.AUTHORED_NPC_BASE and go up to AUTHORED_NPC_COUNT
    assert.equal(isNpcSpecialSprite(Spr.AUTHORED_NPC_BASE), true);
    assert.equal(isNpcSpecialSprite(Spr.AUTHORED_NPC_BASE + 1), true);
    assert.equal(isNpcSpecialSprite(Spr.AUTHORED_NPC_BASE + Spr.AUTHORED_NPC_COUNT - 1), true);
  });

  await t.test('returns true for floor 69 female sprites', () => {
    assert.equal(isNpcSpecialSprite(Spr.F69_FEMALE_NPC_BASE), true);
    assert.equal(isNpcSpecialSprite(Spr.F69_FEMALE_NPC_0), true);
    assert.equal(isNpcSpecialSprite(Spr.F69_FEMALE_NPC_7), true);
  });

  await t.test('returns false for non-special sprites', () => {
    assert.equal(isNpcSpecialSprite(Spr.BULLET), false);
    assert.equal(isNpcSpecialSprite(Spr.DESK), false);
    assert.equal(isNpcSpecialSprite(Spr.ITEM_DROP), false);
    assert.equal(isNpcSpecialSprite(Spr.FEATURE_BASE), false);
    assert.equal(isNpcSpecialSprite(-1), false);
    assert.equal(isNpcSpecialSprite(0), false);
  });
});

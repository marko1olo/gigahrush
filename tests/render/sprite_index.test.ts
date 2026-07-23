import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { authoredNpcSpriteGeneratorOffset, isAuthoredNpcSpr, Spr, authoredNpcSpriteOffset, authoredNpcSpr, monsterSpr, featureSpr, containerSpr, hostileProjectileSprite } from '../../src/render/sprite_index';
import { MonsterKind, Feature, ContainerKind } from '../../src/core/types';

describe('Sprite Index Utilities', () => {
  describe('authoredNpcSpriteGeneratorOffset', () => {
    it('returns 0 for the base authored NPC sprite', () => {
      assert.strictEqual(authoredNpcSpriteGeneratorOffset(Spr.AUTHORED_NPC_BASE), 0);
    });

    it('returns the correct offset for valid authored NPC sprites', () => {
      for (let i = 0; i < Spr.AUTHORED_NPC_COUNT; i++) {
        assert.strictEqual(authoredNpcSpriteGeneratorOffset(Spr.AUTHORED_NPC_BASE + i), i);
      }
    });

    it('returns -1 for sprites just below the base', () => {
      assert.strictEqual(authoredNpcSpriteGeneratorOffset(Spr.AUTHORED_NPC_BASE - 1), -1);
    });

    it('returns -1 for sprites at or above the upper bound', () => {
      assert.strictEqual(authoredNpcSpriteGeneratorOffset(Spr.AUTHORED_NPC_BASE + Spr.AUTHORED_NPC_COUNT), -1);
      assert.strictEqual(authoredNpcSpriteGeneratorOffset(Spr.AUTHORED_NPC_BASE + Spr.AUTHORED_NPC_COUNT + 10), -1);
    });

    it('returns -1 for negative values', () => {
      assert.strictEqual(authoredNpcSpriteGeneratorOffset(-1), -1);
      assert.strictEqual(authoredNpcSpriteGeneratorOffset(-100), -1);
    });

    it('returns -1 for zero (assuming 0 is not the base)', () => {
      if (Spr.AUTHORED_NPC_BASE !== 0) {
        assert.strictEqual(authoredNpcSpriteGeneratorOffset(0), -1);
      }
    });

    it('truncates floating point values and returns correct offset if valid', () => {
      assert.strictEqual(authoredNpcSpriteGeneratorOffset(Spr.AUTHORED_NPC_BASE + 0.1), 0);
      assert.strictEqual(authoredNpcSpriteGeneratorOffset(Spr.AUTHORED_NPC_BASE + 0.99), 0);

      const middleOffset = Math.floor(Spr.AUTHORED_NPC_COUNT / 2);
      assert.strictEqual(authoredNpcSpriteGeneratorOffset(Spr.AUTHORED_NPC_BASE + middleOffset + 0.5), middleOffset);
    });

    it('truncates floating point values and returns -1 if out of bounds', () => {
      assert.strictEqual(authoredNpcSpriteGeneratorOffset(Spr.AUTHORED_NPC_BASE - 0.1), -1);
      assert.strictEqual(authoredNpcSpriteGeneratorOffset(Spr.AUTHORED_NPC_BASE + Spr.AUTHORED_NPC_COUNT + 0.1), -1);
    });
  });

  describe('isAuthoredNpcSpr', () => {
    it('returns true for valid authored NPC sprites', () => {
      for (let i = 0; i < Spr.AUTHORED_NPC_COUNT; i++) {
        assert.strictEqual(isAuthoredNpcSpr(Spr.AUTHORED_NPC_BASE + i), true);
      }
    });

    it('returns false for sprites just below the base', () => {
      assert.strictEqual(isAuthoredNpcSpr(Spr.AUTHORED_NPC_BASE - 1), false);
    });

    it('returns false for sprites at or above the upper bound', () => {
      assert.strictEqual(isAuthoredNpcSpr(Spr.AUTHORED_NPC_BASE + Spr.AUTHORED_NPC_COUNT), false);
      assert.strictEqual(isAuthoredNpcSpr(Spr.AUTHORED_NPC_BASE + Spr.AUTHORED_NPC_COUNT + 10), false);
    });

    it('returns false for negative values', () => {
      assert.strictEqual(isAuthoredNpcSpr(-1), false);
    });

    it('returns false for zero (assuming 0 is not the base)', () => {
      if (Spr.AUTHORED_NPC_BASE !== 0) {
        assert.strictEqual(isAuthoredNpcSpr(0), false);
      }
    });

    it('correctly handles floating point values', () => {
      assert.strictEqual(isAuthoredNpcSpr(Spr.AUTHORED_NPC_BASE + 0.5), true);
      assert.strictEqual(isAuthoredNpcSpr(Spr.AUTHORED_NPC_BASE - 0.5), false);
      assert.strictEqual(isAuthoredNpcSpr(Spr.AUTHORED_NPC_BASE + Spr.AUTHORED_NPC_COUNT + 0.5), false);
    });
  });


  describe('authoredNpcSpriteOffset', () => {
    it('returns valid offset for known authored NPC', () => {
      assert.ok(authoredNpcSpriteOffset('veteran_stepanych') >= 0);
      assert.ok(authoredNpcSpriteOffset('gordon_freeman') >= 0);
    });

    it('returns -1 for unknown authored NPC', () => {
      assert.strictEqual(authoredNpcSpriteOffset('unknown_npc_id_test'), -1);
    });
  });

  describe('authoredNpcSpr', () => {
    it('returns valid sprite index for known authored NPC', () => {
      const spr = authoredNpcSpr('veteran_stepanych');
      assert.ok(spr >= Spr.AUTHORED_NPC_BASE);
      assert.strictEqual(spr, Spr.VETERAN);
    });

    it('throws error for unknown authored NPC', () => {
      assert.throws(() => authoredNpcSpr('unknown_npc_id_test'), /unknown authored NPC sprite/);
    });
  });

  describe('monsterSpr', () => {
    it('returns valid sprite index for known monster kind', () => {
      assert.ok(monsterSpr(MonsterKind.SBORKA) >= 0);
      assert.ok(monsterSpr(MonsterKind.TVAR) >= 0);
    });

    it('returns -1 for unknown monster kind', () => {
      // Cast to MonsterKind to test fallback
      assert.strictEqual(monsterSpr(-999 as MonsterKind), -1);
    });
  });

  describe('featureSpr', () => {
    it('returns valid sprite index for known feature', () => {
      assert.ok(featureSpr(Feature.DESK) >= 0);
      assert.ok(featureSpr(Feature.LAMP) >= 0);
    });

    it('returns -1 for unknown feature', () => {
      assert.strictEqual(featureSpr(-999 as Feature), -1);
    });
  });

  describe('containerSpr', () => {
    it('returns valid sprite index for known container kind', () => {
      assert.ok(containerSpr(ContainerKind.WOODEN_CHEST) >= 0);
      assert.ok(containerSpr(ContainerKind.METAL_CABINET) >= 0);
    });

    it('returns -1 for unknown container kind', () => {
      assert.strictEqual(containerSpr(-999 as ContainerKind), -1);
    });
  });

  describe('hostileProjectileSprite', () => {
    it('maps player projectiles to hostile variants', () => {
      assert.strictEqual(hostileProjectileSprite(Spr.BULLET), Spr.HOSTILE_BULLET);
      assert.strictEqual(hostileProjectileSprite(Spr.PELLET), Spr.HOSTILE_PELLET);
      assert.strictEqual(hostileProjectileSprite(Spr.NAIL), Spr.HOSTILE_NAIL);
      assert.strictEqual(hostileProjectileSprite(Spr.PSI_BOLT), Spr.HOSTILE_PSI_BOLT);
      assert.strictEqual(hostileProjectileSprite(Spr.PLASMA_BOLT), Spr.HOSTILE_PLASMA_BOLT);
      assert.strictEqual(hostileProjectileSprite(Spr.FLAME_BOLT), Spr.HOSTILE_FLAME_BOLT);
    });

    it('returns the same sprite if it is not a player projectile', () => {
      assert.strictEqual(hostileProjectileSprite(Spr.GRENADE), Spr.GRENADE);
      assert.strictEqual(hostileProjectileSprite(Spr.DESK), Spr.DESK);
      assert.strictEqual(hostileProjectileSprite(Spr.HOSTILE_BULLET), Spr.HOSTILE_BULLET);
    });
  });
});

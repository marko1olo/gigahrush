import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { categorizeNpcAge } from '../src/data/npc_art_visuals';

describe('npc_art_visuals', () => {
  describe('categorizeNpcAge', () => {
    it('returns "adult" when age is undefined', () => {
      assert.equal(categorizeNpcAge(undefined), 'adult');
    });

    it('returns "child" for age <= 14', () => {
      assert.equal(categorizeNpcAge(0), 'child');
      assert.equal(categorizeNpcAge(7), 'child');
      assert.equal(categorizeNpcAge(14), 'child');
      assert.equal(categorizeNpcAge(-5), 'child');
    });

    it('returns "young" for age between 15 and 25', () => {
      assert.equal(categorizeNpcAge(15), 'young');
      assert.equal(categorizeNpcAge(20), 'young');
      assert.equal(categorizeNpcAge(25), 'young');
    });

    it('returns "adult" for age between 26 and 59', () => {
      assert.equal(categorizeNpcAge(26), 'adult');
      assert.equal(categorizeNpcAge(40), 'adult');
      assert.equal(categorizeNpcAge(59), 'adult');
    });

    it('returns "old" for age >= 60', () => {
      assert.equal(categorizeNpcAge(60), 'old');
      assert.equal(categorizeNpcAge(75), 'old');
      assert.equal(categorizeNpcAge(100), 'old');
    });
  });
});

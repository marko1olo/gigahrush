import test from 'node:test';
import assert from 'node:assert/strict';
import { categorizeNpcAge } from '../src/data/npc_art_visuals';

test('categorizeNpcAge', async (t) => {
  await t.test('returns "adult" when age is undefined', () => {
    assert.equal(categorizeNpcAge(undefined), 'adult');
  });

  await t.test('returns "child" for age <= 14', () => {
    assert.equal(categorizeNpcAge(0), 'child');
    assert.equal(categorizeNpcAge(10), 'child');
    assert.equal(categorizeNpcAge(14), 'child');
  });

  await t.test('returns "young" for age between 15 and 25', () => {
    assert.equal(categorizeNpcAge(15), 'young');
    assert.equal(categorizeNpcAge(20), 'young');
    assert.equal(categorizeNpcAge(25), 'young');
  });

  await t.test('returns "adult" for age between 26 and 59', () => {
    assert.equal(categorizeNpcAge(26), 'adult');
    assert.equal(categorizeNpcAge(40), 'adult');
    assert.equal(categorizeNpcAge(59), 'adult');
  });

  await t.test('returns "old" for age >= 60', () => {
    assert.equal(categorizeNpcAge(60), 'old');
    assert.equal(categorizeNpcAge(80), 'old');
    assert.equal(categorizeNpcAge(120), 'old');
  });
});

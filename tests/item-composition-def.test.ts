import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { compositionForItemDef } from '../src/data/item_composition.js';
import { ItemType } from '../src/core/types.js';

import type { ItemDef } from '../src/core/types.js';

describe('compositionForItemDef', () => {
  it('generates a deterministic composition vector based on item type and tags', () => {
    const mockDef = {
      id: 'test_medicine',
      name: 'Test Medicine',
      type: ItemType.MEDICINE,
      value: 100,
      tags: ['medical', 'zhelemish', 'chemical'],
    } as ItemDef;

    const comp = compositionForItemDef(mockDef);
    assert.equal(comp.length, 9, 'Should return a CraftVector of length 9');

    const sum = comp.reduce((acc, val) => acc + val, 0);
    assert.ok(sum > 0, 'Composition should allocate some materials');

    // chemical index is 4
    assert.ok(comp[4] > 0, 'Should have chemical materials');
  });

  it('allocates materials accurately based on base weights for weapons', () => {
    const mockDef = {
      id: 'test_weapon',
      name: 'Test Weapon',
      type: ItemType.WEAPON,
      value: 500,
      tags: ['metal', 'weapon_component'],
    } as ItemDef;

    const comp = compositionForItemDef(mockDef);
    // metal and mechanics are normally added for weapons
    // metal is index 5, mechanics is index 0
    assert.ok(comp[5] > 0, 'Weapon should allocate metal');
  });

  it('handles zero base weights gracefully with fallback to consumables/mechanics', () => {
     const mockDef = {
      id: 'test_unknown',
      name: 'Test Unknown',
      type: ItemType.MISC,
      value: 20,
      tags: [],
    } as ItemDef;

    const comp = compositionForItemDef(mockDef);
    assert.equal(comp.length, 9);
    const sum = comp.reduce((acc, val) => acc + val, 0);
    assert.ok(sum > 0, 'Should allocate fallback components');

    // index 2 is consumables
    assert.ok(comp[2] > 0, 'Should fallback to consumables');
  });

  it('respects intentional rare minimum overrides', () => {
    // using a weapon that has intentional rare materials
    const mockDef = {
      id: 'gauss',
      name: 'Gauss Rifle',
      type: ItemType.WEAPON,
      value: 60000,
    } as ItemDef;
    const comp = compositionForItemDef(mockDef);

    // cybernetics is index 6
    assert.ok(comp[6] >= 1, 'Gauss rifle should have at least 1 cybernetics');
  });
});

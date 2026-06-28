import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { compositionForItemDef, itemComposition, ITEM_COMPOSITIONS } from '../src/data/item_composition.js';
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

describe('itemComposition', () => {
  it('returns valid ItemCompositionDef for an existing item', () => {
    const itemIds = Object.keys(ITEM_COMPOSITIONS);
    if (itemIds.length === 0) {
      // If there are no items in ITEM_COMPOSITIONS during the test, skip.
      // But typically there are items defined in ITEMS.
      return;
    }

    const testItemId = itemIds[0];
    const result = itemComposition(testItemId);

    assert.ok(result, 'Should return a defined object for an existing item ID');
    assert.equal(result.itemId, testItemId, 'Should contain the correct itemId');
    assert.equal(result.craftable, true, 'craftable should be true by default');
    assert.equal(result.discoverable, true, 'discoverable should be true by default');
    assert.ok(Array.isArray(result.components), 'components should be an array (CraftVector)');
    assert.equal(result.components.length, 9, 'components should have exactly 9 elements');
    assert.deepEqual(result.components, ITEM_COMPOSITIONS[testItemId], 'components array should match the one in ITEM_COMPOSITIONS');
  });

  it('returns undefined for a non-existent item ID', () => {
    const result = itemComposition('this_item_id_does_not_exist_123');
    assert.equal(result, undefined, 'Should return undefined for unknown item IDs');
  });
});

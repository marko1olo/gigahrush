import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { hasInventoryRoom } from '../../src/render/economy_ui';
import { ITEMS } from '../../src/data/catalog';
import { MAX_INVENTORY_SLOTS } from '../../src/data/inventory_limits';
import { ItemType } from '../../src/core/types';

test('hasInventoryRoom', async (t) => {
  // Setup mock catalog items if they are not already populated
  if (!ITEMS['test_item_stackable']) {
    ITEMS['test_item_stackable'] = {
      id: 'test_item_stackable',
      name: 'Stackable Item',
      type: ItemType.FOOD,
      stack: 5,
    };
  }

  if (!ITEMS['test_item_unstackable']) {
    ITEMS['test_item_unstackable'] = {
      id: 'test_item_unstackable',
      name: 'Unstackable Item',
      type: ItemType.WEAPON, // Or any other type that does not stack by default
      stack: 1, // Force stack size to 1 just in case
    };
  }

  await t.test('returns false if item definition does not exist', () => {
    assert.equal(hasInventoryRoom([], 'nonexistent_item'), false);
  });

  await t.test('returns true for empty inventory and valid item', () => {
    assert.equal(hasInventoryRoom([], 'test_item_stackable'), true);
  });

  await t.test('returns true when there is an empty slot', () => {
    const inv = [
      { defId: 'test_item_unstackable', count: 1 }
    ];
    // Still have room since MAX_INVENTORY_SLOTS is larger
    assert.equal(hasInventoryRoom(inv, 'test_item_stackable'), true);
  });

  await t.test('returns false when inventory is full of unstackable items', () => {
    const inv = Array.from({ length: MAX_INVENTORY_SLOTS }, () => ({
      defId: 'test_item_unstackable',
      count: 1
    }));
    assert.equal(hasInventoryRoom(inv, 'test_item_stackable'), false);
  });

  await t.test('returns true when inventory is full but has a stackable slot with room', () => {
    const inv = Array.from({ length: MAX_INVENTORY_SLOTS }, (_, i) => {
      if (i === 0) return { defId: 'test_item_stackable', count: 1 };
      return { defId: 'test_item_unstackable', count: 1 };
    });
    // We want to add another 'test_item_stackable'. The first slot has count 1 (max 5).
    assert.equal(hasInventoryRoom(inv, 'test_item_stackable'), true);
  });

  await t.test('returns false when inventory is full and the stackable slot is also full', () => {
    const inv = Array.from({ length: MAX_INVENTORY_SLOTS }, (_, i) => {
      if (i === 0) return { defId: 'test_item_stackable', count: 5 }; // Max stack for this mock
      return { defId: 'test_item_unstackable', count: 1 };
    });
    assert.equal(hasInventoryRoom(inv, 'test_item_stackable'), false);
  });

  await t.test('does not stack if item has data (e.g. condition, custom name)', () => {
    const inv = Array.from({ length: MAX_INVENTORY_SLOTS }, (_, i) => {
      if (i === 0) return { defId: 'test_item_stackable', count: 1, data: { condition: 0.5 } };
      return { defId: 'test_item_unstackable', count: 1 };
    });
    assert.equal(hasInventoryRoom(inv, 'test_item_stackable'), false);
  });

  await t.test('handles undefined inventory gracefully', () => {
    assert.equal(hasInventoryRoom(undefined, 'test_item_stackable'), true);
  });
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { inventoryForSave } from '../src/systems/save_payload';
import type { Item } from '../src/core/types';

test('inventoryForSave handles undefined and empty inputs', () => {
  assert.equal(inventoryForSave(undefined), undefined);
  assert.deepEqual(inventoryForSave([]), []);
});

test('inventoryForSave processes valid items correctly', () => {
  const input: Item[] = [
    { defId: 'bread', count: 1 },
    { defId: 'bandage', count: 5, data: { note: 'keep' } }
  ];

  const result = inventoryForSave(input);
  assert.ok(result);
  assert.equal(result.length, 2);
  assert.equal(result[0].defId, 'bread');
  assert.equal(result[0].count, 1);
  assert.equal(result[1].defId, 'bandage');
  assert.equal(result[1].count, 5);
  assert.deepEqual(result[1].data, { note: 'keep' });
});

test('inventoryForSave skips invalid items', () => {
  const input: any[] = [
    { defId: 'bread', count: 1 },
    { defId: '', count: 1 }, // empty string
    { defId: null, count: 1 }, // non-string
    { count: 1 }, // missing defId
    { defId: 'bandage', count: 2 }
  ];

  const result = inventoryForSave(input);
  assert.ok(result);
  assert.equal(result.length, 2);
  assert.equal(result[0].defId, 'bread');
  assert.equal(result[1].defId, 'bandage');
});

test('inventoryForSave limits defId length to 64 chars', () => {
  const longId = 'a'.repeat(100);
  const result = inventoryForSave([{ defId: longId, count: 1 }]);

  assert.ok(result);
  assert.equal(result[0].defId, 'a'.repeat(64));
  assert.equal(result[0].defId.length, 64);
});

test('inventoryForSave splits unknown items with count > 255', () => {
  const input: Item[] = [
    { defId: 'unknown_item', count: 600 }
  ];
  const result = inventoryForSave(input);

  assert.ok(result);
  assert.equal(result.length, 3);
  assert.deepEqual(result, [
    { defId: 'unknown_item', count: 255 },
    { defId: 'unknown_item', count: 255 },
    { defId: 'unknown_item', count: 90 }
  ]);
});

test('inventoryForSave splits known items exceeding their max stack', () => {
  const input: Item[] = [
    { defId: 'govnyak_brick', count: 14 }
  ];
  // govnyak_brick has stack size 6
  const result = inventoryForSave(input);

  assert.ok(result);
  assert.equal(result.length, 3);
  assert.deepEqual(result, [
    { defId: 'govnyak_brick', count: 6 },
    { defId: 'govnyak_brick', count: 6 },
    { defId: 'govnyak_brick', count: 2 }
  ]);
});

test('inventoryForSave respects capacity cap and stops adding items', () => {
  const input: Item[] = [
    { defId: 'item1', count: 1 },
    { defId: 'item2', count: 1 },
    { defId: 'item3', count: 1 }
  ];
  const result = inventoryForSave(input, 2);

  assert.ok(result);
  assert.equal(result.length, 2);
  assert.deepEqual(result, [
    { defId: 'item1', count: 1 },
    { defId: 'item2', count: 1 }
  ]);
});

test('inventoryForSave respects capacity cap when splitting stacks', () => {
  const input: Item[] = [
    { defId: 'govnyak_brick', count: 20 }
  ];
  // govnyak_brick has max stack 6.
  // 20 would be 6, 6, 6, 2. That's 4 items, but cap is 2.
  const result = inventoryForSave(input, 2);

  assert.ok(result);
  assert.equal(result.length, 2);
  assert.deepEqual(result, [
    { defId: 'govnyak_brick', count: 6 },
    { defId: 'govnyak_brick', count: 6 }
  ]);
});

test('inventoryForSave compacts and drops data correctly', () => {
  const input: Item[] = [
    { defId: 'valid1', count: 1, data: { test: 123 } },
    { defId: 'valid2', count: 1, data: null },
    { defId: 'valid3', count: 1, data: undefined },
    { defId: 'valid4', count: 1, data: 'string' }
  ];
  const result = inventoryForSave(input);

  assert.ok(result);
  assert.equal(result.length, 4);
  assert.deepEqual(result[0].data, { test: 123 });
  assert.equal(result[1].data, null);
  assert.equal('data' in result[2], false);
  assert.equal(result[3].data, 'string');
});

test('inventoryForSave handles invalid or string counts', () => {
  const input: any[] = [
    { defId: 'bread', count: '3' },
    { defId: 'bread2', count: NaN },
    { defId: 'bread3' }, // no count
    { defId: 'bread4', count: -5 }
  ];
  const result = inventoryForSave(input);

  assert.ok(result);
  assert.equal(result.length, 4);
  assert.equal(result[0].count, 3);
  assert.equal(result[1].count, 1);
  assert.equal(result[2].count, 1);
  assert.equal(result[3].count, 1);
});

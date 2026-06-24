import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  registerNetTerminalGenItem,
  NET_TERMINAL_GEN_ITEM_ID,
  NET_TERMINAL_GEN_FLESH_ITEM
} from '../src/data/net_terminal_gen';
import { ItemDef, ItemType } from '../src/core/types';

test('registerNetTerminalGenItem adds the flesh item to the provided items record', () => {
  const mockItems: Record<string, ItemDef> = {};

  registerNetTerminalGenItem(mockItems);

  assert.ok(mockItems[NET_TERMINAL_GEN_ITEM_ID]);
  assert.deepEqual(mockItems[NET_TERMINAL_GEN_ITEM_ID], NET_TERMINAL_GEN_FLESH_ITEM);
});

test('registerNetTerminalGenItem does not overwrite an existing item with the same ID', () => {
  const existingItem: ItemDef = {
    id: NET_TERMINAL_GEN_ITEM_ID,
    name: 'Existing Item',
    type: ItemType.MISC,
    desc: 'Existing',
    spawnRooms: [],
    spawnW: 0,
    value: 10,
    tags: [],
    stack: 1,
  };

  const mockItems: Record<string, ItemDef> = {
    [NET_TERMINAL_GEN_ITEM_ID]: existingItem,
  };

  registerNetTerminalGenItem(mockItems);

  assert.equal(mockItems[NET_TERMINAL_GEN_ITEM_ID], existingItem);
  assert.notDeepEqual(mockItems[NET_TERMINAL_GEN_ITEM_ID], NET_TERMINAL_GEN_FLESH_ITEM);
});

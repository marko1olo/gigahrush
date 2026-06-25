import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { EntityType, type Entity, type Item } from '../src/core/types';
import { MAX_INVENTORY_SLOTS, MAX_ITEM_STACK } from '../src/data/inventory_limits';
import { canAddItem, addItem, removeItem, hasItem, getWeaponReadiness, inventoryItemCategory } from '../src/systems/inventory';
import { makeTestPlayer } from './helpers';

test('inventory method canAddItem determines if an item can be added', () => {
  const player = makeTestPlayer({ inventory: [] });
  assert.equal(canAddItem(player, 'bread', 1), true);

  // Fill inventory
  player.inventory = Array.from({ length: MAX_INVENTORY_SLOTS }, () => ({ defId: 'pipe', count: 1 }));
  assert.equal(canAddItem(player, 'bread', 1), false);

  // Replace one with a stackable item
  player.inventory[0] = { defId: 'bread', count: 1 };
  assert.equal(canAddItem(player, 'bread', 1), true); // can stack with existing bread
});

test('inventory method addItem adds items and handles stacking correctly', () => {
  const player = makeTestPlayer({ inventory: [] });

  assert.equal(addItem(player, 'bread', 1), true);
  assert.equal(player.inventory?.length, 1);
  assert.equal(player.inventory?.[0].defId, 'bread');
  assert.equal(player.inventory?.[0].count, 1);

  // Stacking
  assert.equal(addItem(player, 'bread', 2), true);
  assert.equal(player.inventory?.length, 1);
  assert.equal(player.inventory?.[0].count, 3);

  // Different item
  assert.equal(addItem(player, 'pipe', 1), true);
  assert.equal(player.inventory?.length, 2);
  assert.equal(player.inventory?.[1].defId, 'pipe');

  // Invalid item
  assert.equal(addItem(player, 'invalid_item_id', 1), false);
});

test('inventory method removeItem removes items and handles partial stacks correctly', () => {
  const player = makeTestPlayer({ inventory: [{ defId: 'bread', count: 2 }, { defId: 'pipe', count: 1 }] });

  // Partial removal
  assert.equal(removeItem(player, 'bread', 1), true);
  assert.equal(player.inventory?.length, 2);
  assert.equal(player.inventory?.[0].defId, 'bread');
  assert.equal(player.inventory?.[0].count, 1);

  // Full removal of stack
  assert.equal(removeItem(player, 'bread', 1), true);
  assert.equal(player.inventory?.length, 1);
  assert.equal(player.inventory?.[0].defId, 'pipe');

  // Trying to remove something not there
  assert.equal(removeItem(player, 'bread', 1), false);
});

test('inventory method hasItem checks item presence correctly', () => {
  const player = makeTestPlayer({ inventory: [{ defId: 'bread', count: 1 }] });
  assert.equal(hasItem(player, 'bread'), true);
  assert.equal(hasItem(player, 'pipe'), false);
});

test('inventory method getWeaponReadiness returns accurate readiness for weapons and fists', () => {
  const player = makeTestPlayer({ inventory: [], rpg: { str: 0, agi: 0, end: 0, int: 0, cha: 0, per: 0, maxHp: 10, maxPsi: 10, hp: 10, psi: 10, level: 1, xp: 0, attrPoints: 0 }});

  // Fists
  const readinessFists = getWeaponReadiness(player, '');
  assert.equal(readinessFists.name, 'Кулаки');
  assert.equal(readinessFists.warning, false);

  // Ammo-based
  player.inventory = [{ defId: 'ammo_9mm', count: 0 }];
  const readinessGunNoAmmo = getWeaponReadiness(player, 'karkarov_pistol');
  assert.equal(readinessGunNoAmmo.warning, true);
  assert.equal(readinessGunNoAmmo.cannotFireReason, 'нет патронов');

  player.inventory = [{ defId: 'ammo_9mm', count: 10 }];
  const readinessGunWithAmmo = getWeaponReadiness(player, 'karkarov_pistol');
  assert.equal(readinessGunWithAmmo.warning, false);
  assert.equal(readinessGunWithAmmo.resourceCurrent, 10);
});

test('inventory method inventoryItemCategory returns correct category', () => {
  assert.equal(inventoryItemCategory('bread'), 'food');
  assert.equal(inventoryItemCategory('karkarov_pistol'), 'weapon');
  assert.equal(inventoryItemCategory('flashlight'), 'tool');
});

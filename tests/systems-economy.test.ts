import assert from 'node:assert/strict';
import test from 'node:test';
import { FloorLevel } from '../src/core/types';
import { makeGameState } from './helpers';
import { ensureEconomyState, changeResourceStock, canSpendResources, spendResources } from '../src/systems/economy';
import { createEconomyFloorState } from '../src/data/economy';
import { getRecentEvents, createWorldEventState } from '../src/systems/events';

test('changeResourceStock updates resource stock correctly and limits it', () => {
  const state = makeGameState({ currentFloor: FloorLevel.LIVING });
  const economy = ensureEconomyState(state);
  economy.floors[FloorLevel.LIVING] = createEconomyFloorState(FloorLevel.LIVING);

  const initialStock = economy.floors[FloorLevel.LIVING]!.resources['drink_water']!.stock;

  const success1 = changeResourceStock(state, 'drink_water', -10, FloorLevel.LIVING);
  assert.equal(success1, true);
  assert.equal(economy.floors[FloorLevel.LIVING]!.resources['drink_water']!.stock, initialStock - 10);

  const success2 = changeResourceStock(state, 'drink_water', 5, FloorLevel.LIVING);
  assert.equal(success2, true);
  assert.equal(economy.floors[FloorLevel.LIVING]!.resources['drink_water']!.stock, initialStock - 5);

  changeResourceStock(state, 'drink_water', -1000, FloorLevel.LIVING);
  assert.equal(economy.floors[FloorLevel.LIVING]!.resources['drink_water']!.stock, 0);

  changeResourceStock(state, 'drink_water', 1000, FloorLevel.LIVING);
  assert.equal(economy.floors[FloorLevel.LIVING]!.resources['drink_water']!.stock, 240);
});

test('changeResourceStock fails for non-existent resource', () => {
  const state = makeGameState({ currentFloor: FloorLevel.LIVING });

  const success = changeResourceStock(state, 'non_existent_resource', 10, FloorLevel.LIVING);
  assert.equal(success, false);
});

test('changeResourceStock publishes scarcity event when crossing threshold', () => {
  const state = makeGameState({ currentFloor: FloorLevel.LIVING, worldEvents: createWorldEventState() });
  const economy = ensureEconomyState(state);
  economy.floors[FloorLevel.LIVING] = createEconomyFloorState(FloorLevel.LIVING);

  economy.floors[FloorLevel.LIVING]!.resources['drink_water']!.stock = 65;

  changeResourceStock(state, 'drink_water', -65, FloorLevel.LIVING);

  // The event type produced by publishResourceScarcityEvent is 'room_lacked_resources' for 'worsened'
  const worsenedEvents = getRecentEvents(state, { type: 'room_lacked_resources', limit: 5 });
  assert.ok(worsenedEvents.length > 0);

  const scarcityEvent = worsenedEvents.find(e => e.tags.includes('resource_shortage'));
  assert.ok(scarcityEvent);
  assert.equal(scarcityEvent.data?.resourceId, 'drink_water');
  assert.equal(scarcityEvent.data?.trend, 'worsened');

  // Try recovery
  changeResourceStock(state, 'drink_water', 65, FloorLevel.LIVING);

  // The event type produced by publishResourceScarcityEvent is 'room_produced_items' for 'recovered'
  const recoveredEvents = getRecentEvents(state, { type: 'room_produced_items', limit: 5 });
  const recoveryEvent = recoveredEvents.find(e => e.tags.includes('resource_recovery'));
  assert.ok(recoveryEvent);
  assert.equal(recoveryEvent.data?.trend, 'recovered');
});

test('canSpendResources checks if multiple resources can be spent', () => {
  const state = makeGameState({ currentFloor: FloorLevel.LIVING });
  const economy = ensureEconomyState(state);
  economy.floors[FloorLevel.LIVING] = createEconomyFloorState(FloorLevel.LIVING);

  economy.floors[FloorLevel.LIVING]!.resources['drink_water']!.stock = 10;
  economy.floors[FloorLevel.LIVING]!.resources['food']!.stock = 5;

  assert.equal(canSpendResources(state, [{ id: 'drink_water', count: 5 }]), true);
  assert.equal(canSpendResources(state, [{ id: 'drink_water', count: 10 }]), true);
  assert.equal(canSpendResources(state, [{ id: 'drink_water', count: 11 }]), false);

  assert.equal(canSpendResources(state, [{ id: 'drink_water', count: 5 }, { id: 'food', count: 5 }]), true);
  assert.equal(canSpendResources(state, [{ id: 'drink_water', count: 5 }, { id: 'food', count: 6 }]), false);

  assert.equal(canSpendResources(state, [{ id: 'non_existent', count: 1 }]), false);
});

test('spendResources spends resources only if all are available', () => {
  const state = makeGameState({ currentFloor: FloorLevel.LIVING });
  const economy = ensureEconomyState(state);
  economy.floors[FloorLevel.LIVING] = createEconomyFloorState(FloorLevel.LIVING);

  economy.floors[FloorLevel.LIVING]!.resources['drink_water']!.stock = 10;
  economy.floors[FloorLevel.LIVING]!.resources['food']!.stock = 5;

  // Attempt to spend more than available
  const success1 = spendResources(state, [{ id: 'drink_water', count: 5 }, { id: 'food', count: 6 }]);
  assert.equal(success1, false);
  // Stock should not be modified
  assert.equal(economy.floors[FloorLevel.LIVING]!.resources['drink_water']!.stock, 10);
  assert.equal(economy.floors[FloorLevel.LIVING]!.resources['food']!.stock, 5);

  // Spend available
  const success2 = spendResources(state, [{ id: 'drink_water', count: 5 }, { id: 'food', count: 4 }]);
  assert.equal(success2, true);
  assert.equal(economy.floors[FloorLevel.LIVING]!.resources['drink_water']!.stock, 5);
  assert.equal(economy.floors[FloorLevel.LIVING]!.resources['food']!.stock, 1);
});

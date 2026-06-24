import assert from 'node:assert/strict';
import test from 'node:test';
import { FloorLevel, type GameState } from '../src/core/types';
import { createEconomyFloorState } from '../src/data/economy';
import { canSpendResources, spendResources, ensureEconomyState } from '../src/systems/economy';
import { makeGameState } from './helpers';

function resetFloor(state: GameState, floor: FloorLevel): void {
  const economy = ensureEconomyState(state);
  economy.floors[floor] = createEconomyFloorState(floor);
}

function setResourceStock(state: GameState, floor: FloorLevel, resourceId: string, stock: number): void {
  const economy = ensureEconomyState(state);
  if (!economy.floors[floor]) {
    economy.floors[floor] = createEconomyFloorState(floor);
  }
  economy.floors[floor]!.resources[resourceId] = {
    stock,
    target: 100,
    lastDelta: 0
  };
}

test('canSpendResources returns true when inputs are empty', () => {
  const state = makeGameState({ currentFloor: FloorLevel.LIVING });
  resetFloor(state, FloorLevel.LIVING);

  const result = canSpendResources(state, []);
  assert.equal(result, true);
});

test('canSpendResources returns false if a required resource does not exist', () => {
  const state = makeGameState({ currentFloor: FloorLevel.LIVING });
  resetFloor(state, FloorLevel.LIVING);

  const result = canSpendResources(state, [{ id: 'nonexistent_resource', count: 5 }]);
  assert.equal(result, false);
});

test('canSpendResources returns false if resource stock is insufficient', () => {
  const state = makeGameState({ currentFloor: FloorLevel.LIVING });
  setResourceStock(state, FloorLevel.LIVING, 'wood', 3);

  const result = canSpendResources(state, [{ id: 'wood', count: 5 }]);
  assert.equal(result, false);
});

test('canSpendResources returns true if resource stock is sufficient', () => {
  const state = makeGameState({ currentFloor: FloorLevel.LIVING });
  setResourceStock(state, FloorLevel.LIVING, 'wood', 10);
  setResourceStock(state, FloorLevel.LIVING, 'stone', 5);

  const result = canSpendResources(state, [
    { id: 'wood', count: 5 },
    { id: 'stone', count: 5 }
  ]);
  assert.equal(result, true);
});

test('canSpendResources uses the provided floor when checking stock', () => {
  const state = makeGameState({ currentFloor: FloorLevel.LIVING });
  setResourceStock(state, FloorLevel.LIVING, 'wood', 0);
  setResourceStock(state, FloorLevel.KVARTIRY, 'wood', 10);

  const livingResult = canSpendResources(state, [{ id: 'wood', count: 5 }], FloorLevel.LIVING);
  assert.equal(livingResult, false);

  const kvartiryResult = canSpendResources(state, [{ id: 'wood', count: 5 }], FloorLevel.KVARTIRY);
  assert.equal(kvartiryResult, true);
});

test('canSpendResources defaults to currentFloor when floor is not provided', () => {
  const state = makeGameState({ currentFloor: FloorLevel.KVARTIRY });
  setResourceStock(state, FloorLevel.LIVING, 'wood', 0);
  setResourceStock(state, FloorLevel.KVARTIRY, 'wood', 10);

  const result = canSpendResources(state, [{ id: 'wood', count: 5 }]);
  assert.equal(result, true);
});

test('spendResources fails if resources cannot be spent', () => {
  const state = makeGameState({ currentFloor: FloorLevel.LIVING });
  setResourceStock(state, FloorLevel.LIVING, 'wood', 3);

  const result = spendResources(state, [{ id: 'wood', count: 5 }]);
  assert.equal(result, false);

  const economy = ensureEconomyState(state);
  assert.equal(economy.floors[FloorLevel.LIVING]?.resources['wood']?.stock, 3);
});

test('spendResources succeeds and reduces stock when resources can be spent', () => {
  const state = makeGameState({ currentFloor: FloorLevel.LIVING });
  setResourceStock(state, FloorLevel.LIVING, 'wood', 10);

  const result = spendResources(state, [{ id: 'wood', count: 5 }]);
  assert.equal(result, true);

  const economy = ensureEconomyState(state);
  assert.equal(economy.floors[FloorLevel.LIVING]?.resources['wood']?.stock, 5);
});

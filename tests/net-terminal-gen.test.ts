import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { deriveNetTerminalGenTarget } from '../src/systems/net_terminal_gen';
import { ensureFloorRunState } from '../src/systems/procedural_floors';
import { makeGameState } from './helpers';
import { FloorLevel } from '../src/core/types';

test('deriveNetTerminalGenTarget returns valid target structure', () => {
  const state = makeGameState({ currentFloor: FloorLevel.LIVING });
  const result = deriveNetTerminalGenTarget(state);

  assert.equal(typeof result.runSeed, 'number');
  assert.equal(typeof result.targetZ, 'number');
  assert.equal(typeof result.targetKey, 'string');
  assert.equal(typeof result.rawX, 'number');
  assert.equal(typeof result.rawY, 'number');
});

test('deriveNetTerminalGenTarget is deterministic', () => {
  const state1 = makeGameState({ currentFloor: FloorLevel.LIVING });
  const runState1 = ensureFloorRunState(state1);
  runState1.runSeed = 12345;
  const target1 = deriveNetTerminalGenTarget(state1);

  const state2 = makeGameState({ currentFloor: FloorLevel.LIVING });
  const runState2 = ensureFloorRunState(state2);
  runState2.runSeed = 12345;
  const target2 = deriveNetTerminalGenTarget(state2);

  assert.deepEqual(target1, target2);
});

test('deriveNetTerminalGenTarget changes target based on runSeed', () => {
  const state1 = makeGameState({ currentFloor: FloorLevel.LIVING });
  const runState1 = ensureFloorRunState(state1);
  runState1.runSeed = 12345;
  const target1 = deriveNetTerminalGenTarget(state1);

  const state2 = makeGameState({ currentFloor: FloorLevel.LIVING });
  const runState2 = ensureFloorRunState(state2);
  runState2.runSeed = 54321;
  const target2 = deriveNetTerminalGenTarget(state2);

  assert.notDeepEqual(target1, target2);
});

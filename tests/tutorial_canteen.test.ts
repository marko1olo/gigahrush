import { test } from 'node:test';
import * as assert from 'node:assert';
import { makeGameState } from './helpers.js';
import { TutorialStep } from '../src/systems/tutorial.js';
import { publishEvent } from '../src/systems/events.js';
import { World } from '../src/core/world.js';
import { DoorState } from '../src/core/types.js';
import { updateContentRuntimeHooks } from '../src/systems/content_hooks.js';

test('tutorial canteen script handles EAT step correctly', () => {
  const state = makeGameState();
  state.tutorialMode = true;
  state.tutorialStep = TutorialStep.EAT;

  const world = new World(10, 10);
  world.doors.set(100, {
    idx: 100,
    state: DoorState.LOCKED,
    roomA: 1,
    roomB: 2,
    keyId: 'tut_factory_key',
    timer: 0
  });

  // Pick up food
  publishEvent(state, {
    type: 'player_pick_item',
    itemId: 'bread',
    itemCount: 1,
    severity: 2,
    privacy: 'public',
    tags: []
  });

  assert.strictEqual(state.tutorialStep, TutorialStep.EAT, 'Step should not advance on pickup');
  assert.ok(state.msgs.some(m => m.text === 'Открой инвентарь и съешь это.'), 'Should show pickup hint');

  // Use food
  publishEvent(state, {
    type: 'player_use_item',
    itemId: 'bread',
    itemCount: 1,
    severity: 2,
    privacy: 'public',
    tags: []
  });

  assert.strictEqual(state.tutorialStep, TutorialStep.WORK, 'Step should advance to WORK after eating');
  assert.strictEqual(state.tutorialUnlockFactoryDoor, true, 'Should request unlocking door');

  // Run hook
  updateContentRuntimeHooks({
    world,
    entities: [],
    player: {} as any,
    state,
    nextEntityId: { v: 1 },
    dt: 0,
    phase: 'post_ai',
    gameOver: false
  });

  const door = world.doors.get(100);
  assert.strictEqual(door?.state, DoorState.OPEN, 'Factory door should be unlocked');
  assert.strictEqual(state.tutorialUnlockFactoryDoor, false, 'Flag should be reset');
});

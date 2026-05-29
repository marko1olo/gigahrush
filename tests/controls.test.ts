import { afterEach, beforeEach, test } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  CONTROL_ACTIONS,
  clearControlBinding,
  controlActionLocked,
  controlBindings,
  consumeControlCaptureCode,
  beginControlCapture,
  matchesControlAction,
  resetAllControlBindings,
  setControlPrimaryBinding,
} from '../src/systems/controls';

beforeEach(() => {
  resetAllControlBindings();
});

afterEach(() => {
  resetAllControlBindings();
});

test('keyboard rebinding appends keys without stealing them from other actions', () => {
  assert.equal(matchesControlAction('quests', 'KeyQ'), true);

  assert.equal(setControlPrimaryBinding('moveBackward', 'KeyQ'), true);

  assert.deepEqual([...controlBindings('moveBackward')], ['KeyS', 'ArrowDown', 'KeyQ']);
  assert.equal(matchesControlAction('moveBackward', 'KeyQ'), true);
  assert.equal(matchesControlAction('quests', 'KeyQ'), true);
});

test('main gameplay keys are rebindable and can share one physical key', () => {
  assert.equal(controlActionLocked('interact'), false);
  assert.equal(controlActionLocked('gameMenu'), false);

  assert.equal(setControlPrimaryBinding('moveBackward', 'KeyE'), true);
  assert.equal(setControlPrimaryBinding('quests', 'Enter'), true);
  assert.equal(setControlPrimaryBinding('moveForward', 'Backspace'), true);
  assert.equal(setControlPrimaryBinding('quests', 'Escape'), false);

  assert.deepEqual([...controlBindings('interact')], ['KeyE']);
  assert.deepEqual([...controlBindings('gameMenu')], ['Enter']);
  assert.equal(matchesControlAction('moveBackward', 'KeyE'), true);
  assert.equal(matchesControlAction('interact', 'KeyE'), true);
  assert.equal(matchesControlAction('quests', 'Enter'), true);
  assert.equal(matchesControlAction('gameMenu', 'Enter'), true);
  assert.equal(matchesControlAction('moveForward', 'Backspace'), true);
  assert.equal(matchesControlAction('quests', 'Escape'), false);
});

test('Backspace clears listed actions and the clear command is not listed as a binding row', () => {
  assert.equal(clearControlBinding('quests'), true);
  assert.deepEqual([...controlBindings('quests')], []);

  assert.equal(CONTROL_ACTIONS.some((action: { id: string }) => action.id === 'controlReset'), false);
  assert.deepEqual([...controlBindings('netErase')], ['Backspace']);
});

test('capture assigns Enter and Backspace instead of using them as hardcoded cancel or clear', () => {
  beginControlCapture('quests');
  assert.equal(consumeControlCaptureCode('Enter'), true);
  assert.equal(matchesControlAction('quests', 'Enter'), true);

  beginControlCapture('quests');
  assert.equal(consumeControlCaptureCode('Backspace'), true);
  assert.equal(matchesControlAction('quests', 'Backspace'), true);
});

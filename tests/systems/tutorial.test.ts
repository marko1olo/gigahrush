import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../../src/core/world';
import { TutorialStep, DoorState } from '../../src/core/types';
import { initTutorial, TUTORIAL_STEPS } from '../../src/systems/tutorial';

test('tutorial module', async (t) => {
  await t.test('initTutorial is callable', () => {
    initTutorial();
    assert.ok(true);
  });
});

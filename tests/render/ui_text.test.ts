import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { setUiTextTime, getUiTextTimeForTesting } from '../../src/render/ui_text';

test('setUiTextTime updates global state', async (t) => {
  await t.test('sets valid finite numbers', () => {
    setUiTextTime(42);
    assert.equal(getUiTextTimeForTesting(), 42);

    setUiTextTime(0);
    assert.equal(getUiTextTimeForTesting(), 0);

    setUiTextTime(-10);
    assert.equal(getUiTextTimeForTesting(), -10);
  });

  await t.test('defaults to 0 for non-finite numbers', () => {
    setUiTextTime(Infinity);
    assert.equal(getUiTextTimeForTesting(), 0);

    setUiTextTime(-Infinity);
    assert.equal(getUiTextTimeForTesting(), 0);

    setUiTextTime(NaN);
    assert.equal(getUiTextTimeForTesting(), 0);
  });
});

import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { containerGridScale, dialogMenuScale, tradeGridScale } from '../src/render/ui_layout';

test('NPC dialog text can grow beyond the capped global HUD scale', () => {
  assert.equal(dialogMenuScale(640, 400, 2, 2), 2);
  assert.ok(dialogMenuScale(1920, 1080, 2, 2) > 3);
});

test('trade and container inventories use large cells on desktop canvases', () => {
  assert.ok(tradeGridScale(1920, 1080) >= 3.9);
  assert.ok(containerGridScale(1920, 1080) >= 3.9);
});

test('trade inventory scale still fits shorter canvases', () => {
  const scale = tradeGridScale(1280, 720);
  assert.ok(scale > 2.5);
  assert.ok((22 * 5 * 2 + 24) * scale <= 1280 * 0.88 + 0.001);
  assert.ok((28 + 22 * 5 + 58) * scale <= 720 * 0.78 + 0.001);
});

test('grid scale does not force tiny mobile canvases to overflow', () => {
  const scale = containerGridScale(280, 180);
  assert.ok(scale < 1);
  assert.ok((22 * 5 * 2 + 24) * scale <= 280 * 0.88 + 0.001);
  assert.ok((30 + 22 * 5 + 66) * scale <= 180 * 0.78 + 0.001);
});

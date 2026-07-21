import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { generateSprite } from '../src/entities/chernosliz';
import { S, CLEAR } from '../src/render/pixutil';

test('generateSprite creates a Uint32Array of expected size', () => {
  const sprite = generateSprite();
  assert.ok(sprite instanceof Uint32Array);
  assert.equal(sprite.length, S * S);
});

test('generateSprite produces a deterministically generated sprite', () => {
  const sprite1 = generateSprite();
  const sprite2 = generateSprite();

  assert.deepEqual(sprite1, sprite2, 'sprite generation should be deterministic');
});

test('generateSprite draws the monster body/pool', () => {
  const sprite = generateSprite();
  let drawnPixels = 0;

  for (let i = 0; i < sprite.length; i++) {
    if (sprite[i] !== CLEAR) {
      drawnPixels++;
    }
  }

  assert.ok(drawnPixels > 100, 'should draw a substantial monster sprite');
});

test('generateSprite draws the glowing core/eye', () => {
  const sprite = generateSprite();
  const cx = S / 2;
  // Core should be centered and bright green-ish.
  // from chernosliz.ts: put(t, x, y, clamp(50 + glow * 60), clamp(190 + glow * 55), clamp(60 + glow * 60));
  // Let's sample a pixel near the center
  const corePixel = sprite[29 * S + cx];

  assert.notEqual(corePixel, CLEAR, 'core pixel should not be clear');
});

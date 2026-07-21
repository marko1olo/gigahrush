import test from 'node:test';
import assert from 'node:assert/strict';

import { generateTravelerSprite } from '../src/entities/npc';
import { S, CLEAR } from '../src/render/pixutil';

test('generateTravelerSprite creates a Uint32Array of expected size', () => {
  const sprite = generateTravelerSprite();
  assert.ok(sprite instanceof Uint32Array);
  assert.equal(sprite.length, S * S);
});

test('generateTravelerSprite produces a deterministically generated sprite', () => {
  const sprite1 = generateTravelerSprite();
  const sprite2 = generateTravelerSprite();

  assert.deepEqual(sprite1, sprite2, 'sprite generation should be deterministic');
});

test('generateTravelerSprite draws a backpack on the right side', () => {
  const sprite = generateTravelerSprite();
  const cx = Math.floor(S / 2);
  const B_TOP = 22;

  let backpackPixels = 0;
  let expectedPixels = 0;

  for (let y = B_TOP + 2; y < B_TOP + 14; y++) {
    for (let x = cx + 8; x < cx + 12; x++) {
      if (x >= 0 && x < S && y >= 0 && y < S) {
        expectedPixels++;
        const pixel = sprite[y * S + x];
        // Ensure we don't count undefined as a colored pixel
        if (pixel !== undefined && pixel !== CLEAR) {
          backpackPixels++;
        }
      }
    }
  }

  assert.ok(expectedPixels > 0, 'Backpack area should be within sprite bounds');
  assert.equal(backpackPixels, expectedPixels, `should draw all ${expectedPixels} backpack pixels`);
});

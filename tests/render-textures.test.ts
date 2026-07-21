import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateTextures } from '../src/render/textures';
import { Tex } from '../src/core/types';
import { S } from '../src/render/pixutil';

test('generateTextures generates the correct number of textures', () => {
  const textures = generateTextures();
  assert.equal(textures.length, Tex.COUNT, 'Should generate one texture for each Tex enum value');
});

test('each generated texture has the correct dimensions', () => {
  const textures = generateTextures();
  const expectedLength = S * S;

  for (let i = 0; i < textures.length; i++) {
    const tex = textures[i];
    assert.ok(tex instanceof Uint32Array, `Texture at index ${i} should be a Uint32Array`);
    assert.equal(tex.length, expectedLength, `Texture at index ${i} should have length ${expectedLength} (${S}x${S})`);
  }
});

test('textures contain non-transparent pixels', () => {
  const textures = generateTextures();

  // Test a few specific textures to ensure they aren't completely empty
  const concrete = textures[Tex.CONCRETE];
  let hasOpaque = false;
  for (let i = 0; i < concrete.length; i++) {
    if ((concrete[i] >>> 24) !== 0) {
      hasOpaque = true;
      break;
    }
  }
  assert.ok(hasOpaque, 'CONCRETE texture should contain some opaque pixels');

  const brick = textures[Tex.BRICK];
  hasOpaque = false;
  for (let i = 0; i < brick.length; i++) {
    if ((brick[i] >>> 24) !== 0) {
      hasOpaque = true;
      break;
    }
  }
  assert.ok(hasOpaque, 'BRICK texture should contain some opaque pixels');
});

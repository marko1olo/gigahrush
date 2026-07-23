import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateTextures } from '../src/render/textures';
import { Tex } from '../src/core/types';
import { S } from '../src/render/pixutil';

test('generateTextures generates the correct number of textures', () => {
  const textures = generateTextures();
  assert.equal(textures.length, Tex.COUNT, 'Should generate one texture for each Tex enum value');
});

test('texture generation is deterministic', () => {
  const textures1 = generateTextures();
  const textures2 = generateTextures();

  assert.equal(textures1.length, textures2.length, 'Should generate the same number of textures');

  for (let i = 0; i < textures1.length; i++) {
    const tex1 = textures1[i];
    const tex2 = textures2[i];

    assert.equal(tex1.length, tex2.length, `Texture length mismatch at index ${i}`);

    // Test the first 100 pixels to avoid massive output if there's a difference,
    // and a spot check for overall equality to be efficient.
    let isIdentical = true;
    for (let j = 0; j < tex1.length; j++) {
      if (tex1[j] !== tex2[j]) {
        isIdentical = false;
        break;
      }
    }
    assert.ok(isIdentical, `Texture mismatch at index ${i}`);
  }
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

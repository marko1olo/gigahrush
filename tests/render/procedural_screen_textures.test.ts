import test from 'node:test';
import assert from 'node:assert/strict';
import { generateProceduralScreenTextures } from '../../src/render/procedural_screen_textures';
import { SCREEN_VARIANTS, SCREEN_FRAMES, SCREEN_TEX_COUNT } from '../../src/data/procedural_screen_textures';
import { Tex } from '../../src/core/types';

test('generateProceduralScreenTextures generates textures for the correct indices and does not touch others', () => {
  const TEX_SIZE = 64 * 64;

  // Create textures array initialized to 0
  const textures: Uint32Array[] = [];
  for (let i = 0; i < 231; i++) { // Tex.COUNT is 231
    textures.push(new Uint32Array(TEX_SIZE));
  }

  generateProceduralScreenTextures(textures);

  const SCREEN_BASE = 197; // Tex.SCREEN_BASE is 197

  // Assert textures before SCREEN_BASE are untouched
  for (let i = 0; i < SCREEN_BASE; i++) {
    const isClean = textures[i].every(pixel => pixel === 0);
    assert.ok(isClean, `Texture ${i} should be untouched`);
  }

  // Assert procedural screen textures are modified
  for (let variant = 0; variant < SCREEN_VARIANTS; variant++) {
    for (let frame = 0; frame < SCREEN_FRAMES; frame++) {
      const texIndex = SCREEN_BASE + variant * SCREEN_FRAMES + frame;
      const isModified = textures[texIndex].some(pixel => pixel !== 0);
      assert.ok(isModified, `Screen texture ${texIndex} should be modified`);
    }
  }

  // Assert textures after the screen textures are untouched
  for (let i = SCREEN_BASE + SCREEN_TEX_COUNT; i < 231; i++) {
    const isClean = textures[i].every(pixel => pixel === 0);
    assert.ok(isClean, `Texture ${i} should be untouched`);
  }
});

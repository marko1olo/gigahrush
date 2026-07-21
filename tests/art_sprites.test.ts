import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateArtNudeSprite, generateFloor69FemaleNpcSprite, ART_NUDE_VARIANTS, F69_FEMALE_NPC_VARIANTS } from '../src/render/art_sprites';
import { S } from '../src/render/pixutil';

test('generateArtNudeSprite generates correct size and non-empty sprites', () => {
  for (let i = 0; i < ART_NUDE_VARIANTS; i++) {
    const sprite = generateArtNudeSprite(i);
    assert.equal(sprite.length, S * S, `Sprite variant ${i} should have size ${S * S}`);

    let opaqueCount = 0;
    for (let j = 0; j < sprite.length; j++) {
      if ((sprite[j] >>> 24) !== 0) {
        opaqueCount++;
      }
    }
    assert.ok(opaqueCount > 0, `Sprite variant ${i} should have opaque pixels`);
    assert.ok(opaqueCount < sprite.length, `Sprite variant ${i} should not be completely opaque`);
  }
});

test('generateFloor69FemaleNpcSprite generates correct size and non-empty sprites', () => {
  for (let i = 0; i < F69_FEMALE_NPC_VARIANTS; i++) {
    const sprite = generateFloor69FemaleNpcSprite(i);
    assert.equal(sprite.length, S * S, `F69 NPC Sprite variant ${i} should have size ${S * S}`);

    let opaqueCount = 0;
    for (let j = 0; j < sprite.length; j++) {
      if ((sprite[j] >>> 24) !== 0) {
        opaqueCount++;
      }
    }
    assert.ok(opaqueCount > 0, `F69 NPC Sprite variant ${i} should have opaque pixels`);
    assert.ok(opaqueCount < sprite.length, `F69 NPC Sprite variant ${i} should not be completely opaque`);
  }
});

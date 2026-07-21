import test from 'node:test';
import * as assert from 'node:assert/strict';
import {
  chooseSamosborVariant,
  getActiveSamosborVariant,
  clearActiveSamosborVariant,
  forceNextSamosborVariant,
  cycleForcedSamosborVariant,
  getForcedSamosborVariant,
  getLastSamosborVariant,
  setActiveSamosborVariantForTests,
} from '../../src/systems/samosbor_variants_runtime';
import { FloorLevel } from '../../src/core/types';
import { SAMOSBOR_VARIANTS } from '../../src/data/samosbor_variants';

function withMockRandom<T>(mockValue: number, fn: () => T): T {
  const originalCrypto = globalThis.crypto;
  const originalMathRandom = Math.random;

  Math.random = () => mockValue;

  Object.defineProperty(globalThis, 'crypto', {
    value: {
      getRandomValues: (arr: Uint32Array) => {
        arr[0] = Math.floor(mockValue * 4294967296);
        return arr;
      }
    },
    configurable: true,
    writable: true,
  });

  try {
    return fn();
  } finally {
    if (originalCrypto !== undefined) {
      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        configurable: true,
        writable: true,
      });
    } else {
      // @ts-ignore
      delete globalThis.crypto;
    }
    Math.random = originalMathRandom;
  }
}

test('Samosbor Variants Runtime - active variant management', () => {
  clearActiveSamosborVariant();
  assert.equal(getActiveSamosborVariant(), null);

  const dummyVariant = { def: { id: 'dummy' } } as any;
  setActiveSamosborVariantForTests(dummyVariant);
  assert.equal(getActiveSamosborVariant(), dummyVariant);

  clearActiveSamosborVariant();
  assert.equal(getActiveSamosborVariant(), null);
});

test('Samosbor Variants Runtime - forced variant management', () => {
  clearActiveSamosborVariant();
  // Clear any existing forced next variant side effect
  while (getForcedSamosborVariant()) {
    chooseSamosborVariant(FloorLevel.LIVING);
  }

  // force valid
  const firstVariantId = SAMOSBOR_VARIANTS[0].id;
  const success = forceNextSamosborVariant(firstVariantId);
  assert.equal(success, true);
  assert.equal(getForcedSamosborVariant(), firstVariantId);

  // force invalid
  const invalidSuccess = forceNextSamosborVariant('invalid_variant_id' as any);
  assert.equal(invalidSuccess, false);
  // should not change the current forced variant
  assert.equal(getForcedSamosborVariant(), firstVariantId);

  // cycle
  const currentIdx = SAMOSBOR_VARIANTS.findIndex(v => v.id === firstVariantId);
  const nextVariantId = SAMOSBOR_VARIANTS[(currentIdx + 1) % SAMOSBOR_VARIANTS.length].id;

  const cycledId = cycleForcedSamosborVariant();
  assert.equal(cycledId, nextVariantId);
  assert.equal(getForcedSamosborVariant(), nextVariantId);

  // clean up
  while (getForcedSamosborVariant()) {
    chooseSamosborVariant(FloorLevel.LIVING);
  }
});

test('Samosbor Variants Runtime - chooseSamosborVariant handles forced variant correctly', () => {
  clearActiveSamosborVariant();
  while (getForcedSamosborVariant()) {
    chooseSamosborVariant(FloorLevel.LIVING);
  }

  const validForLiving = SAMOSBOR_VARIANTS.find(v => v.floors.includes(FloorLevel.LIVING))!;
  forceNextSamosborVariant(validForLiving.id);

  const picked = chooseSamosborVariant(FloorLevel.LIVING);
  assert.equal(picked.def.id, validForLiving.id);
  assert.equal(getActiveSamosborVariant()?.def.id, validForLiving.id);
  assert.equal(getLastSamosborVariant(), validForLiving.id);
  assert.equal(getForcedSamosborVariant(), null, 'Forced variant should be consumed');

  clearActiveSamosborVariant();
});

test('Samosbor Variants Runtime - chooseSamosborVariant fallback on invalid forced variant', () => {
  clearActiveSamosborVariant();
  while (getForcedSamosborVariant()) {
    chooseSamosborVariant(FloorLevel.LIVING);
  }

  const ministryVariant = SAMOSBOR_VARIANTS.find(v => v.floors.includes(FloorLevel.MINISTRY) && !v.floors.includes(FloorLevel.LIVING))!;
  // If there's no such variant, we can just skip or find another combo
  if (!ministryVariant) return;

  forceNextSamosborVariant(ministryVariant.id);

  // mock random to 0 to ensure deterministic fallback pick
  const picked = withMockRandom(0, () => chooseSamosborVariant(FloorLevel.LIVING));

  assert.notEqual(picked.def.id, ministryVariant.id, 'Should not pick invalid forced variant');
  assert.equal(getForcedSamosborVariant(), null, 'Forced variant should still be consumed');
});

test('Samosbor Variants Runtime - chooseSamosborVariant random selection', () => {
  clearActiveSamosborVariant();
  while (getForcedSamosborVariant()) {
    chooseSamosborVariant(FloorLevel.LIVING);
  }

  // test mock random = 0 (first weight)
  let picked0 = withMockRandom(0, () => chooseSamosborVariant(FloorLevel.LIVING));
  assert.ok(picked0);
  assert.equal(getLastSamosborVariant(), picked0.def.id);

  // test mock random = 0.999 (last weight or default fallback)
  let picked99 = withMockRandom(0.9999, () => chooseSamosborVariant(FloorLevel.LIVING));
  assert.ok(picked99);
  assert.equal(getLastSamosborVariant(), picked99.def.id);
});

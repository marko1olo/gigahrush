import { describe, test, beforeEach } from 'node:test';
import * as assert from 'node:assert/strict';
import { FloorLevel } from '../src/core/types';
import {
  chooseSamosborVariant,
  getActiveSamosborVariant,
  clearActiveSamosborVariant,
  forceNextSamosborVariant,
  getForcedSamosborVariant,
  cycleForcedSamosborVariant,
  getLastSamosborVariant,
  setActiveSamosborVariantForTests,
} from '../src/systems/samosbor_variants_runtime';
import { SAMOSBOR_VARIANTS } from '../src/data/samosbor_variants';

describe('samosbor_variants_runtime', () => {
  beforeEach(() => {
    // Clear active variant
    clearActiveSamosborVariant();

    // Clear forced variant by choosing and letting it reset
    // We do it in a loop just in case, though once should be enough.
    while (getForcedSamosborVariant() !== null) {
      chooseSamosborVariant(FloorLevel.LIVING);
    }
  });

  test('chooseSamosborVariant randomly selects a variant for the floor', () => {
    // We should get *some* variant back, and it should become active
    const variant = chooseSamosborVariant(FloorLevel.LIVING);
    assert.ok(variant);
    assert.ok(variant.def);

    const active = getActiveSamosborVariant();
    assert.equal(active, variant);

    const last = getLastSamosborVariant();
    assert.equal(last, variant.def.id);
  });

  test('forceNextSamosborVariant sets the next variant', () => {
    // Ensure "wet" exists in SAMOSBOR_VARIANTS
    const wetExists = SAMOSBOR_VARIANTS.some(v => v.id === 'wet');
    assert.equal(wetExists, true);

    const success = forceNextSamosborVariant('wet');
    assert.equal(success, true);
    assert.equal(getForcedSamosborVariant(), 'wet');

    // Choose it on a floor where "wet" is allowed
    const variant = chooseSamosborVariant(FloorLevel.MAINTENANCE);
    assert.equal(variant.def.id, 'wet');

    // Forced variant should be consumed
    assert.equal(getForcedSamosborVariant(), null);
  });

  test('chooseSamosborVariant ignores forced variant if it is not allowed on the floor', () => {
    // "electric" is not allowed on HELL
    const success = forceNextSamosborVariant('electric');
    assert.equal(success, true);

    // Call choose on HELL
    const variant = chooseSamosborVariant(FloorLevel.HELL);

    // It shouldn't be "electric" because it's filtered out
    assert.notEqual(variant.def.id, 'electric');

    // But forcedNextVariant should still be consumed
    assert.equal(getForcedSamosborVariant(), null);
  });

  test('forceNextSamosborVariant returns false for invalid id', () => {
    const success = forceNextSamosborVariant('non_existent_variant' as any);
    assert.equal(success, false);
    assert.equal(getForcedSamosborVariant(), null);
  });

  test('cycleForcedSamosborVariant cycles through all variants', () => {
    const ids = SAMOSBOR_VARIANTS.map(v => v.id);

    // Initially null, cycling should start with the first item
    const first = cycleForcedSamosborVariant();
    assert.equal(first, ids[0]);
    assert.equal(getForcedSamosborVariant(), ids[0]);

    // Cycle again
    const second = cycleForcedSamosborVariant();
    assert.equal(second, ids[1]);
    assert.equal(getForcedSamosborVariant(), ids[1]);
  });

  test('setActiveSamosborVariantForTests and clearActiveSamosborVariant manage state', () => {
    const dummyVariant = { dummy: true } as any;
    setActiveSamosborVariantForTests(dummyVariant);
    assert.equal(getActiveSamosborVariant(), dummyVariant);

    clearActiveSamosborVariant();
    assert.equal(getActiveSamosborVariant(), null);
  });
});

import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { clearActiveSamosborVariant, getActiveSamosborVariant, setActiveSamosborVariantForTests } from '../src/systems/samosbor_variants_runtime.js';

test('clearActiveSamosborVariant clears the active variant', () => {
  // Set an active variant first to verify clear actually clears it
  setActiveSamosborVariantForTests({ def: { id: 'test_variant' } } as any);
  assert.notEqual(getActiveSamosborVariant(), null);

  clearActiveSamosborVariant();

  assert.equal(getActiveSamosborVariant(), null);
});

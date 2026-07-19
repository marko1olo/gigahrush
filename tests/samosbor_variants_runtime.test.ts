import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  getActiveSamosborVariant,
  chooseSamosborVariant,
  clearActiveSamosborVariant
} from '../src/systems/samosbor_variants_runtime';
import { FloorLevel } from '../src/core/types';

test('getActiveSamosborVariant returns null initially or after clearing', () => {
  clearActiveSamosborVariant();
  assert.equal(getActiveSamosborVariant(), null);
});

test('getActiveSamosborVariant returns the chosen variant', () => {
  clearActiveSamosborVariant();
  const variant = chooseSamosborVariant(FloorLevel.LIVING);
  assert.ok(variant);
  assert.equal(getActiveSamosborVariant(), variant);
});

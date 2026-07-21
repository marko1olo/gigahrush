import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { clamp } from '../../src/render/pixutil';

describe('pixutil clamp', () => {
  it('returns the number if it is within the range 0..255', () => {
    assert.strictEqual(clamp(0), 0);
    assert.strictEqual(clamp(128), 128);
    assert.strictEqual(clamp(255), 255);
  });

  it('clamps numbers below 0 to 0', () => {
    assert.strictEqual(clamp(-1), 0);
    assert.strictEqual(clamp(-100), 0);
    assert.strictEqual(clamp(-Infinity), 0);
  });

  it('clamps numbers above 255 to 255', () => {
    assert.strictEqual(clamp(256), 255);
    assert.strictEqual(clamp(1000), 255);
    assert.strictEqual(clamp(Infinity), 255);
  });

  it('handles floating point numbers correctly', () => {
    assert.strictEqual(clamp(128.5), 128.5);
    assert.strictEqual(clamp(-0.5), 0);
    assert.strictEqual(clamp(255.5), 255);
  });
});

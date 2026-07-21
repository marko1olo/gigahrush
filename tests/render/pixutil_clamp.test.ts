import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { clamp } from '../../src/render/pixutil';

test('clamp returns the value if it is between 0 and 255', () => {
  assert.equal(clamp(50), 50);
  assert.equal(clamp(128), 128);
  assert.equal(clamp(200), 200);
});

test('clamp returns 0 if the value is less than 0', () => {
  assert.equal(clamp(-1), 0);
  assert.equal(clamp(-50), 0);
  assert.equal(clamp(-1000), 0);
});

test('clamp returns 255 if the value is greater than 255', () => {
  assert.equal(clamp(256), 255);
  assert.equal(clamp(300), 255);
  assert.equal(clamp(1000), 255);
});

test('clamp handles boundaries exactly', () => {
  assert.equal(clamp(0), 0);
  assert.equal(clamp(255), 255);
});

test('clamp handles floating point values correctly', () => {
  assert.equal(clamp(128.5), 128.5);
  assert.equal(clamp(-0.5), 0);
  assert.equal(clamp(255.5), 255);
});

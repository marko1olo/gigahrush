import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeNpcVisualId } from '../src/entities/npc_visuals';

test('sanitizeNpcVisualId - returns undefined for non-string inputs', () => {
  assert.equal(sanitizeNpcVisualId(undefined), undefined);
  assert.equal(sanitizeNpcVisualId(null), undefined);
  assert.equal(sanitizeNpcVisualId(123), undefined);
  assert.equal(sanitizeNpcVisualId({}), undefined);
  assert.equal(sanitizeNpcVisualId([]), undefined);
  assert.equal(sanitizeNpcVisualId(true), undefined);
});

test('sanitizeNpcVisualId - returns undefined for empty or whitespace strings', () => {
  assert.equal(sanitizeNpcVisualId(''), undefined);
  assert.equal(sanitizeNpcVisualId('   '), undefined);
  assert.equal(sanitizeNpcVisualId('\t\n'), undefined);
});

test('sanitizeNpcVisualId - returns undefined for invalid characters', () => {
  assert.equal(sanitizeNpcVisualId('InvalidId'), undefined); // Uppercase
  assert.equal(sanitizeNpcVisualId('invalid id'), undefined); // Space
  assert.equal(sanitizeNpcVisualId('invalid!'), undefined); // Exclamation mark
  assert.equal(sanitizeNpcVisualId('invalid@id'), undefined);
  assert.equal(sanitizeNpcVisualId('invalid/id'), undefined);
});

test('sanitizeNpcVisualId - returns sanitized id for valid strings', () => {
  assert.equal(sanitizeNpcVisualId('valid-id'), 'valid-id');
  assert.equal(sanitizeNpcVisualId('valid_id'), 'valid_id');
  assert.equal(sanitizeNpcVisualId('valid.id'), 'valid.id');
  assert.equal(sanitizeNpcVisualId('valid:id'), 'valid:id');
  assert.equal(sanitizeNpcVisualId('12345'), '12345');
  assert.equal(sanitizeNpcVisualId('a-b_c:d.e'), 'a-b_c:d.e');
});

test('sanitizeNpcVisualId - trims whitespace around valid strings', () => {
  assert.equal(sanitizeNpcVisualId('  valid-id  '), 'valid-id');
  assert.equal(sanitizeNpcVisualId('\tvalid_id\n'), 'valid_id');
});

test('sanitizeNpcVisualId - truncates to 64 characters', () => {
  const longId = 'a'.repeat(70);
  assert.equal(sanitizeNpcVisualId(longId), 'a'.repeat(64));

  const exactLength = 'b'.repeat(64);
  assert.equal(sanitizeNpcVisualId(exactLength), 'b'.repeat(64));
});

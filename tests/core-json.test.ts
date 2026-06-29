import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { safeParseJson } from '../src/core/json';

test('safeParseJson parses valid basic JSON types', () => {
  assert.equal(safeParseJson('"hello"'), 'hello');
  assert.equal(safeParseJson('123'), 123);
  assert.equal(safeParseJson('true'), true);
  assert.equal(safeParseJson('false'), false);
  assert.equal(safeParseJson('null'), null);
});

test('safeParseJson parses arrays', () => {
  assert.deepEqual(safeParseJson('[1, "two", true]'), [1, 'two', true]);
});

test('safeParseJson parses objects', () => {
  assert.deepEqual(safeParseJson('{"a": 1, "b": "c"}'), { a: 1, b: 'c' });
});

test('safeParseJson prevents prototype pollution via __proto__', () => {
  const parsed = safeParseJson('{"a": 1, "__proto__": {"polluted": "yes"}}');
  assert.equal(parsed.a, 1);
  assert.equal(parsed.__proto__, Object.prototype);
  assert.equal((parsed as any).polluted, undefined);
});

test('safeParseJson prevents prototype pollution via constructor', () => {
  const parsed = safeParseJson('{"a": 1, "constructor": {"prototype": {"polluted": "yes"}}}');
  assert.equal(parsed.a, 1);
  // `constructor` is dropped during parsing. The object doesn't have its own
  // `constructor` property. It inherits `Object.prototype.constructor`
  assert.equal(parsed.constructor, Object);
  assert.equal(Object.prototype.constructor, Object);
  assert.equal(parsed.constructor.prototype, Object.prototype);
  assert.equal((parsed as any).polluted, undefined);
  assert.equal(Object.prototype.hasOwnProperty.call(parsed, 'constructor'), false);
});

test('safeParseJson prevents prototype pollution via prototype', () => {
  const parsed = safeParseJson('{"a": 1, "prototype": {"polluted": "yes"}}');
  assert.equal(parsed.a, 1);
  assert.equal(Object.prototype.hasOwnProperty.call(parsed, 'prototype'), false);
});

test('safeParseJson handles nested objects with banned keys', () => {
  const parsed = safeParseJson('{"nested": {"__proto__": {"b": 2}, "c": 3}}');
  assert.deepEqual(parsed, { nested: { c: 3 } });
});

test('safeParseJson handles nested arrays with banned keys as object properties', () => {
    // Array with objects inside it
    const parsed = safeParseJson('[{"__proto__": {"b": 2}}, {"c": 3}]');
    assert.deepEqual(parsed, [{}, { c: 3 }]);
});

test('safeParseJson throws on invalid JSON', () => {
  assert.throws(() => safeParseJson('{invalid}'), SyntaxError);
  assert.throws(() => safeParseJson('{"a": 1,]'), SyntaxError);
});

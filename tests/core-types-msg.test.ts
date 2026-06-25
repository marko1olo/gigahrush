import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';

import { msgAt, type MsgLocation } from '../src/core/types';

describe('msgAt edge cases', () => {
  test('handles valid input properties correctly', () => {
    const location: MsgLocation = {
      x: 10,
      y: 20,
      actorId: 5,
      targetId: 8,
      roomId: 42,
      zoneId: 3,
      floor: 'service',
    };
    const m = msgAt('Hello', 12345, '#fff', location);
    assert.equal(m.x, 10);
    assert.equal(m.y, 20);
    assert.equal(m.actorId, 5);
    assert.equal(m.targetId, 8);
    assert.equal(m.roomId, 42);
    assert.equal(m.zoneId, 3);
    assert.equal(m.floor, 'service');
  });

  test('applies Math.floor to ids', () => {
    const location: MsgLocation = {
      x: 10.5,
      y: -20.5,
      actorId: 5.9,
      targetId: -8.1,
      roomId: 42.5,
      zoneId: 3.2,
    };
    const m = msgAt('Test float', 123, '#000', location);
    assert.equal(m.x, 10.5); // x and y don't have Math.floor applied
    assert.equal(m.y, -20.5);
    assert.equal(m.actorId, 5); // Math.floor(5.9) = 5
    assert.equal(m.targetId, -9); // Math.floor(-8.1) = -9
    assert.equal(m.roomId, 42); // Math.floor(42.5) = 42
    assert.equal(m.zoneId, 3); // Math.floor(3.2) = 3
  });

  test('filters out Infinity and -Infinity', () => {
    const location: MsgLocation = {
      x: Infinity,
      y: -Infinity,
      actorId: Infinity,
      targetId: -Infinity,
      roomId: Infinity,
      zoneId: -Infinity,
    };
    const m = msgAt('Test Infinity', 123, '#000', location);
    assert.equal(m.x, undefined);
    assert.equal(m.y, undefined);
    assert.equal(m.actorId, undefined);
    assert.equal(m.targetId, undefined);
    assert.equal(m.roomId, undefined);
    assert.equal(m.zoneId, undefined);
  });

  test('filters out NaN', () => {
    const location: MsgLocation = {
      x: NaN,
      y: NaN,
      actorId: NaN,
      targetId: NaN,
      roomId: NaN,
      zoneId: NaN,
    };
    const m = msgAt('Test NaN', 123, '#000', location);
    assert.equal(m.x, undefined);
    assert.equal(m.y, undefined);
    assert.equal(m.actorId, undefined);
    assert.equal(m.targetId, undefined);
    assert.equal(m.roomId, undefined);
    assert.equal(m.zoneId, undefined);
  });

  test('handles missing properties', () => {
    const location: MsgLocation = {};
    const m = msgAt('Test missing', 123, '#000', location);
    assert.equal(m.x, undefined);
    assert.equal(m.y, undefined);
    assert.equal(m.actorId, undefined);
    assert.equal(m.targetId, undefined);
    assert.equal(m.roomId, undefined);
    assert.equal(m.zoneId, undefined);
    assert.equal(m.floor, undefined);
  });

  test('handles negative values appropriately', () => {
    const location: MsgLocation = {
      x: -10,
      y: -20,
      actorId: -5,
      targetId: -8,
      roomId: -42,
      zoneId: -3,
    };
    const m = msgAt('Test negative', 123, '#000', location);
    assert.equal(m.x, -10);
    assert.equal(m.y, -20);
    assert.equal(m.actorId, -5);
    assert.equal(m.targetId, -8);
    assert.equal(m.roomId, -42);
    assert.equal(m.zoneId, -3);
  });
});

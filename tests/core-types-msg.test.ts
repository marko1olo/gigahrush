import { test, describe, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';

import { msg, msgAt, setMsgClock, setMsgLocationProvider, type MsgLocation, type GameClock } from '../src/core/types';

describe('msg functionality', () => {
  beforeEach(() => {
    // Reset global state before each test
    setMsgClock({ totalMinutes: 0, hour: 8, minute: 0 });
    setMsgLocationProvider(undefined);
  });

  afterEach(() => {
    // Clean up
    setMsgClock({ totalMinutes: 0, hour: 8, minute: 0 });
    setMsgLocationProvider(undefined);
  });

  test('creates a basic message with default state', () => {
    const m = msg('Hello world', 123, '#fff');
    assert.equal(m.text, 'Hello world');
    assert.equal(m.time, 123);
    assert.equal(m.color, '#fff');
    assert.equal(m.day, 0);
    assert.equal(m.hour, 8);
    assert.equal(m.minute, 0);
    assert.equal(m.distanceMeters, undefined);
  });

  test('incorporates clock state from setMsgClock', () => {
    const clock: GameClock = { totalMinutes: 1440 + 60 + 15, hour: 1, minute: 15 };
    setMsgClock(clock);
    const m = msg('Time test', 456, '#000');
    assert.equal(m.day, 1);
    assert.equal(m.hour, 1);
    assert.equal(m.minute, 15);
  });

  test('incorporates location from setMsgLocationProvider', () => {
    const provider = () => ({ x: 15, y: 25, floor: 'service' });
    setMsgLocationProvider(provider);
    const m = msg('Location test', 789, '#f00');
    assert.equal(m.x, 15);
    assert.equal(m.y, 25);
    assert.equal(m.floor, 'service');
  });

  test('handles distance parameter correctly', () => {
    const m1 = msg('Distance test', 1, '#fff', 5.6);
    assert.equal(m1.distanceMeters, 6); // rounded

    const m2 = msg('Distance test', 1, '#fff', -5);
    assert.equal(m2.distanceMeters, 0); // max(0, rounded)

    const m3 = msg('Distance test', 1, '#fff', Infinity);
    assert.equal(m3.distanceMeters, undefined); // not finite

    const m4 = msg('Distance test', 1, '#fff', NaN);
    assert.equal(m4.distanceMeters, undefined); // not finite
  });
});

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

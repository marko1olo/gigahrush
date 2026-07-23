import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import { clamp } from '../src/core/math.js';

describe('clamp', () => {
    test('returns the value if it is within the range', () => {
        assert.equal(clamp(5, 1, 10), 5);
        assert.equal(clamp(0, -5, 5), 0);
    });

    test('returns the minimum if the value is below the minimum', () => {
        assert.equal(clamp(0, 1, 10), 1);
        assert.equal(clamp(-10, -5, 5), -5);
    });

    test('returns the maximum if the value is above the maximum', () => {
        assert.equal(clamp(15, 1, 10), 10);
        assert.equal(clamp(10, -5, 5), 5);
    });

    test('handles negative numbers correctly', () => {
        assert.equal(clamp(-3, -10, -1), -3);
        assert.equal(clamp(-15, -10, -1), -10);
        assert.equal(clamp(0, -10, -1), -1);
    });

    test('handles floating point numbers correctly', () => {
        assert.equal(clamp(3.14, 1.5, 4.5), 3.14);
        assert.equal(clamp(1.1, 1.5, 4.5), 1.5);
        assert.equal(clamp(5.5, 1.5, 4.5), 4.5);
    });

    test('works when min equals max', () => {
        assert.equal(clamp(5, 2, 2), 2);
        assert.equal(clamp(1, 2, 2), 2);
        assert.equal(clamp(3, 2, 2), 2);
    });

    test('handles inverted min and max gracefully (returns max based on Math.max/min behavior)', () => {
        // Math.max(10, Math.min(1, 5)) -> Math.max(10, 1) -> 10
        // Math.max(10, Math.min(1, 0)) -> Math.max(10, 0) -> 10
        // Math.max(10, Math.min(1, 15)) -> Math.max(10, 1) -> 10
        assert.equal(clamp(5, 10, 1), 10);
    });
});

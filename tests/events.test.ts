import { test } from 'node:test';
import * as assert from 'node:assert';
import { registerWorldEventObserver, publishEvent, unregisterWorldEventObserver } from '../src/systems/events';
import { GameState } from '../src/core/types';

test('event observer error handling', () => {
    const state = {
        time: 0,
        clock: { totalMinutes: 0, hour: 0, minute: 0 },
        currentFloor: 0,
        worldEvents: {
            nextId: 1,
            recentEvents: { capacity: 10, start: 0, count: 0, items: new Array(10).fill(null) },
            importantEvents: { capacity: 10, start: 0, count: 0, items: new Array(10).fill(null) },
            zoneEvents: [],
            facts: []
        }
    } as unknown as GameState;

    let callCount = 0;

    // add an observer that throws
    const throwingObserver = (s: GameState, e: any) => {
        throw new Error('test error');
    };

    // add an observer that doesn't throw, to verify the loop continues
    const goodObserver = (s: GameState, e: any) => {
        callCount++;
    };

    registerWorldEventObserver(throwingObserver);
    registerWorldEventObserver(goodObserver);

    const originalConsoleWarn = console.warn;
    let warnCount = 0;
    console.warn = () => { warnCount++; };

    try {
        publishEvent(state, {
            type: 'test_event',
            severity: 1,
        } as any);

        assert.strictEqual(callCount, 1, 'goodObserver should be called');
        assert.strictEqual(warnCount, 1, 'console.warn should be called for throwingObserver');
    } finally {
        console.warn = originalConsoleWarn;
        unregisterWorldEventObserver(throwingObserver);
        unregisterWorldEventObserver(goodObserver);
    }
});

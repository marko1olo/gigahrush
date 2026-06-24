import test, { describe, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';
import { shouldUseTouchControls } from '../src/mobile.js';

describe('shouldUseTouchControls', () => {
  let originalNavigator: any;
  let originalWindow: any;

  beforeEach(() => {
    originalNavigator = globalThis.navigator;
    originalWindow = globalThis.window;
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true
    });
    Object.defineProperty(globalThis, 'window', {
      value: originalWindow,
      writable: true,
      configurable: true
    });
    delete (globalThis as any).ontouchstart;
  });

  function setupEnv({ userAgent = '', maxTouchPoints = 0, innerWidth = 1000, innerHeight = 1000, ontouchstart = false }) {
    Object.defineProperty(globalThis, 'navigator', {
      value: { userAgent, maxTouchPoints },
      writable: true,
      configurable: true
    });
    Object.defineProperty(globalThis, 'window', {
      value: { innerWidth, innerHeight },
      writable: true,
      configurable: true
    });
    if (ontouchstart) {
      (globalThis as any).ontouchstart = null;
    } else {
      delete (globalThis as any).ontouchstart;
    }
  }

  test('returns true for mobile user agents regardless of other factors', () => {
    setupEnv({ userAgent: 'iPhone', maxTouchPoints: 0, innerWidth: 2000, innerHeight: 2000 });
    assert.equal(shouldUseTouchControls(), true);

    setupEnv({ userAgent: 'Android', maxTouchPoints: 0, innerWidth: 2000, innerHeight: 2000 });
    assert.equal(shouldUseTouchControls(), true);
  });

  test('returns false for desktop user agents without touch', () => {
    setupEnv({ userAgent: 'Windows NT', maxTouchPoints: 0, innerWidth: 1000, innerHeight: 1000 });
    assert.equal(shouldUseTouchControls(), false);
  });

  test('returns true for desktop user agents with touch and compact viewport', () => {
    setupEnv({ userAgent: 'Windows NT', maxTouchPoints: 10, innerWidth: 800, innerHeight: 1000 });
    assert.equal(shouldUseTouchControls(), true);

    setupEnv({ userAgent: 'Windows NT', maxTouchPoints: 10, innerWidth: 1000, innerHeight: 899 });
    assert.equal(shouldUseTouchControls(), true);
  });

  test('returns false for desktop user agents with touch but large viewport', () => {
    setupEnv({ userAgent: 'Windows NT', maxTouchPoints: 10, innerWidth: 900, innerHeight: 900 });
    assert.equal(shouldUseTouchControls(), false);
  });

  test('returns true if ontouchstart is present and viewport is compact', () => {
    setupEnv({ userAgent: 'Macintosh', maxTouchPoints: 0, innerWidth: 800, innerHeight: 800, ontouchstart: true });
    assert.equal(shouldUseTouchControls(), true);
  });

  test('returns false if ontouchstart is present but viewport is large', () => {
    setupEnv({ userAgent: 'Macintosh', maxTouchPoints: 0, innerWidth: 1200, innerHeight: 1200, ontouchstart: true });
    assert.equal(shouldUseTouchControls(), false);
  });
});

import { test, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';

import { shouldUseTouchControls } from '../src/mobile';

test('shouldUseTouchControls', async (t) => {
  const originalNavigator = globalThis.navigator;
  const originalWindow = globalThis.window;
  const originalOntouchstart = (globalThis as any).ontouchstart;

  beforeEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { ...originalNavigator },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'window', {
      value: { ...originalWindow },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'window', {
      value: originalWindow,
      writable: true,
      configurable: true,
    });
    if (originalOntouchstart !== undefined) {
      (globalThis as any).ontouchstart = originalOntouchstart;
    } else {
      delete (globalThis as any).ontouchstart;
    }
  });

  await t.test('returns true when user agent indicates mobile', () => {
    globalThis.navigator = { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1' } as any;

    assert.equal(shouldUseTouchControls(), true);
  });

  await t.test('returns true when user agent indicates android', () => {
    globalThis.navigator = { userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36' } as any;

    assert.equal(shouldUseTouchControls(), true);
  });

  await t.test('returns false when user agent is desktop and no touch capabilities', () => {
    globalThis.navigator = { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36', maxTouchPoints: 0 } as any;
    globalThis.window = { innerWidth: 1920, innerHeight: 1080 } as any;

    assert.equal(shouldUseTouchControls(), false);
  });

  await t.test('returns true for non-mobile user agent but touch capable and compact viewport (maxTouchPoints)', () => {
    globalThis.navigator = { userAgent: 'Desktop-like User Agent', maxTouchPoints: 5 } as any;
    globalThis.window = { innerWidth: 800, innerHeight: 600 } as any;

    assert.equal(shouldUseTouchControls(), true);
  });

  await t.test('returns true for non-mobile user agent but touch capable and compact viewport (ontouchstart)', () => {
    globalThis.navigator = { userAgent: 'Desktop-like User Agent', maxTouchPoints: 0 } as any;
    globalThis.window = { innerWidth: 800, innerHeight: 600 } as any;
    (globalThis as any).ontouchstart = null; // simulate ontouchstart presence

    assert.equal(shouldUseTouchControls(), true);
  });

  await t.test('returns false for touch capable but not compact viewport', () => {
    globalThis.navigator = { userAgent: 'Desktop-like User Agent', maxTouchPoints: 5 } as any;
    globalThis.window = { innerWidth: 1024, innerHeight: 1024 } as any; // Min dimension >= 900

    assert.equal(shouldUseTouchControls(), false);
  });
});

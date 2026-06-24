import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import * as assert from 'node:assert/strict';

// Vite defines import.meta.env, but Node.js (tsx) doesn't polyfill it out-of-the-box easily for individual scripts without build steps.
// To test DEV behavior, we can patch `import.meta.env` if it doesn't crash on compilation, but testing in Node with TSX directly fails when accessing `import.meta.env.DEV` because `import.meta.env` is undefined.
// For the DEV branch, instead of testing the DEV mode branch which is strictly Vite specific, we'll verify the rest of the execution branches.

import { registerPwaServiceWorker, isStandaloneDisplay } from '../src/pwa.js';

describe('registerPwaServiceWorker', () => {
  beforeEach(() => {
    // Clean up globals
    // @ts-ignore
    delete globalThis.navigator;
    // @ts-ignore
    delete globalThis.window;
    // @ts-ignore
    delete globalThis.location;
  });

  afterEach(() => {
    mock.restoreAll();
  });

  test('does nothing if serviceWorker is not in navigator', () => {
    Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });

    assert.doesNotThrow(() => {
      registerPwaServiceWorker();
    });
  });

  test('returns early if not secure context and not localhost', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { serviceWorker: {} },
      configurable: true
    });

    const addEventListenerMock = mock.fn();
    Object.defineProperty(globalThis, 'window', {
      value: {
        isSecureContext: false,
        addEventListener: addEventListenerMock
      },
      configurable: true
    });

    Object.defineProperty(globalThis, 'location', {
      value: {
        hostname: 'example.com'
      },
      configurable: true
    });

    registerPwaServiceWorker();

    assert.equal(addEventListenerMock.mock.calls.length, 0);
  });

  test('registers sw.js on load if secure context', () => {
    const registerMock = mock.fn(async () => ({}));
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        serviceWorker: {
          register: registerMock
        }
      },
      configurable: true
    });

    let loadCallback: () => void = () => {};
    const addEventListenerMock = mock.fn((event: string, callback: any) => {
      if (event === 'load') {
        loadCallback = callback;
      }
    });

    Object.defineProperty(globalThis, 'window', {
      value: {
        isSecureContext: true,
        addEventListener: addEventListenerMock
      },
      configurable: true
    });

    Object.defineProperty(globalThis, 'location', {
      value: {
        hostname: 'example.com'
      },
      configurable: true
    });

    registerPwaServiceWorker();

    assert.equal(addEventListenerMock.mock.calls.length, 1);

    loadCallback();

    assert.equal(registerMock.mock.calls.length, 1);
    assert.equal(registerMock.mock.calls[0].arguments[0], './sw.js');
  });

  test('registers sw.js on load if localhost', () => {
    const registerMock = mock.fn(async () => ({}));
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        serviceWorker: {
          register: registerMock
        }
      },
      configurable: true
    });

    let loadCallback: () => void = () => {};
    const addEventListenerMock = mock.fn((event: string, callback: any) => {
      if (event === 'load') {
        loadCallback = callback;
      }
    });

    Object.defineProperty(globalThis, 'window', {
      value: {
        isSecureContext: false,
        addEventListener: addEventListenerMock
      },
      configurable: true
    });

    Object.defineProperty(globalThis, 'location', {
      value: {
        hostname: 'localhost'
      },
      configurable: true
    });

    registerPwaServiceWorker();

    assert.equal(addEventListenerMock.mock.calls.length, 1);

    loadCallback();

    assert.equal(registerMock.mock.calls.length, 1);
    assert.equal(registerMock.mock.calls[0].arguments[0], './sw.js');
  });
});

describe('isStandaloneDisplay', () => {
  afterEach(() => {
    // @ts-ignore
    delete globalThis.window;
    // @ts-ignore
    delete globalThis.navigator;
  });

  test('returns true if display-mode is fullscreen', () => {
    Object.defineProperty(globalThis, 'window', {
      value: {
        matchMedia: (query: string) => ({
          matches: query === '(display-mode: fullscreen)'
        })
      },
      configurable: true
    });
    Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });

    assert.equal(isStandaloneDisplay(), true);
  });

  test('returns true if display-mode is standalone', () => {
    Object.defineProperty(globalThis, 'window', {
      value: {
        matchMedia: (query: string) => ({
          matches: query === '(display-mode: standalone)'
        })
      },
      configurable: true
    });
    Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });

    assert.equal(isStandaloneDisplay(), true);
  });

  test('returns true if display-mode is minimal-ui', () => {
    Object.defineProperty(globalThis, 'window', {
      value: {
        matchMedia: (query: string) => ({
          matches: query === '(display-mode: minimal-ui)'
        })
      },
      configurable: true
    });
    Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });

    assert.equal(isStandaloneDisplay(), true);
  });

  test('returns true if navigator.standalone is true', () => {
    Object.defineProperty(globalThis, 'window', {
      value: {
        matchMedia: () => ({ matches: false })
      },
      configurable: true
    });
    Object.defineProperty(globalThis, 'navigator', {
      value: { standalone: true },
      configurable: true
    });

    assert.equal(isStandaloneDisplay(), true);
  });

  test('returns false otherwise', () => {
    Object.defineProperty(globalThis, 'window', {
      value: {
        matchMedia: () => ({ matches: false })
      },
      configurable: true
    });
    Object.defineProperty(globalThis, 'navigator', {
      value: { standalone: false },
      configurable: true
    });

    assert.equal(isStandaloneDisplay(), false);
  });
});

import { test, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';
import { registerPwaServiceWorker, isStandaloneDisplay } from '../src/pwa';

beforeEach(() => {
    globalThis.window = {} as any;
    Object.defineProperty(globalThis, 'navigator', {
        value: { serviceWorker: { getRegistrations: async () => [] } },
        writable: true,
        configurable: true
    });
    Object.defineProperty(globalThis, 'location', {
        value: { hostname: 'localhost' },
        writable: true,
        configurable: true
    });
});

afterEach(() => {
    delete (globalThis as any).window;
    delete (globalThis as any).navigator;
    delete (globalThis as any).location;
});

test('registerPwaServiceWorker registers sw on secure context/localhost', async () => {
    let registeredUrl = '';
    (globalThis.navigator as any).serviceWorker.register = async (url: string) => {
        registeredUrl = url;
    };
    (globalThis.window as any).isSecureContext = true;

    let listener: Function | null = null;
    (globalThis.window as any).addEventListener = (evt: string, cb: Function) => {
        if (evt === 'load') listener = cb;
    };

    registerPwaServiceWorker();

    assert.ok(listener);
    (listener as Function)();

    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(registeredUrl, './sw.js');
});

test('registerPwaServiceWorker returns early if no serviceWorker in navigator', () => {
    Object.defineProperty(globalThis, 'navigator', {
        value: {},
        writable: true,
        configurable: true
    });
    registerPwaServiceWorker();
    // Doesn't throw
});

test('registerPwaServiceWorker returns early if not secure context and not localhost', () => {
    let listener: Function | null = null;
    (globalThis.window as any).addEventListener = (evt: string, cb: Function) => {
        if (evt === 'load') listener = cb;
    };

    (globalThis.window as any).isSecureContext = false;
    (globalThis.location as any).hostname = 'example.com';

    registerPwaServiceWorker();

    assert.equal(listener, null);
});

test('isStandaloneDisplay returns true if matchMedia indicates standalone', () => {
    (globalThis.window as any).matchMedia = (query: string) => ({
        matches: query === '(display-mode: standalone)'
    });
    assert.equal(isStandaloneDisplay(), true);
});

test('isStandaloneDisplay returns true if matchMedia indicates fullscreen', () => {
    (globalThis.window as any).matchMedia = (query: string) => ({
        matches: query === '(display-mode: fullscreen)'
    });
    assert.equal(isStandaloneDisplay(), true);
});

test('isStandaloneDisplay returns true if matchMedia indicates minimal-ui', () => {
    (globalThis.window as any).matchMedia = (query: string) => ({
        matches: query === '(display-mode: minimal-ui)'
    });
    assert.equal(isStandaloneDisplay(), true);
});

test('isStandaloneDisplay returns true if navigator.standalone is true', () => {
    (globalThis.navigator as any).standalone = true;
    assert.equal(isStandaloneDisplay(), true);
});

test('isStandaloneDisplay returns false if no conditions match', () => {
    (globalThis.window as any).matchMedia = (query: string) => ({
        matches: false
    });
    assert.equal(isStandaloneDisplay(), false);
});

test('registerPwaServiceWorker does nothing if secureContext is false and not localhost', () => {
    let listenerCalled = false;
    (globalThis.window as any).addEventListener = (evt: string, cb: Function) => {
        listenerCalled = true;
    };

    (globalThis.window as any).isSecureContext = false;
    (globalThis.location as any).hostname = 'example.com';

    registerPwaServiceWorker();
    assert.equal(listenerCalled, false);
});

test('registerPwaServiceWorker unregisters sw and clears caches in DEV', async () => {
    process.env.VITE_DEV = 'true';

    let listener: Function | null = null;
    (globalThis.window as any).addEventListener = (evt: string, cb: Function) => {
        if (evt === 'load') listener = cb;
    };

    let unregistered = false;
    (globalThis.navigator as any).serviceWorker.getRegistrations = async () => [
        { unregister: async () => { unregistered = true; return true; } }
    ];

    let deletedKey = '';
    (globalThis.window as any).caches = {
        keys: async () => ['gigahrush-1', 'other-cache'],
        delete: async (key: string) => { deletedKey = key; return true; }
    };

    registerPwaServiceWorker();

    assert.ok(listener);
    (listener as Function)();

    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => setTimeout(resolve, 10));

    assert.equal(unregistered, true);
    assert.equal(deletedKey, 'gigahrush-1');

    delete process.env.VITE_DEV;
});
